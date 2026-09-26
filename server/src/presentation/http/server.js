import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import AdmZip from 'adm-zip'
import { createAppleMusicRouter } from '../routes/appleMusic.routes.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.join(__dirname, '..', '..', '..')
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(serverRoot, 'data')
const uploadsDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(serverRoot, 'uploads')
const mediaDbPath = path.join(dataDir, 'media.json')
const moviesDbPath = path.join(dataDir, 'movies.json')
const notesDbPath = path.join(dataDir, 'notes.json')
const boardsDbPath = path.join(dataDir, 'boards.json')
const eventsDbPath = path.join(dataDir, 'events.json')
const port = Number(process.env.PORT) || 3001
// TMDb exposes two credential formats. Keep both server-side so the public
// GitHub Pages bundle never receives either one:
// - TMDB_API_TOKEN: v4 bearer token
// - TMDB_API_KEY: v3 API key
const tmdbApiToken = process.env.TMDB_API_TOKEN
const tmdbApiKey = process.env.TMDB_API_KEY
const tmdbTokenLooksLikeV3Key = typeof tmdbApiToken === 'string' && /^[a-f0-9]{32}$/i.test(tmdbApiToken)

const app = express()

const ensureStorage = async () => {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.mkdir(uploadsDir, { recursive: true })

  for (const filePath of [mediaDbPath, moviesDbPath, notesDbPath, boardsDbPath, eventsDbPath]) {
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, '[]\n', 'utf8')
    }
  }
}

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'))
const writeJson = async (filePath, records) => fs.writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
const readMediaDb = () => readJson(mediaDbPath)
const writeMediaDb = (records) => writeJson(mediaDbPath, records)
const readMoviesDb = () => readJson(moviesDbPath)
const writeMoviesDb = (records) => writeJson(moviesDbPath, records)
const readNotesDb = () => readJson(notesDbPath)
const writeNotesDb = (records) => writeJson(notesDbPath, records)
const readBoardsDb = () => readJson(boardsDbPath)
const writeBoardsDb = (records) => writeJson(boardsDbPath, records)
const readEventsDb = () => readJson(eventsDbPath)
const writeEventsDb = (records) => writeJson(eventsDbPath, records)

const toSafeTheme = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const buildPublicUploadUrl = (fileName) => `/uploads/${fileName}`
const getTmdbImageUrl = (imagePath) => imagePath ? `https://image.tmdb.org/t/p/w500${imagePath}` : null
const toTmdbMovieItem = (movie) => ({tmdb_id: movie.id,title: movie.title,poster_url:getTmdbImageUrl(movie.poster_path),backdrop_url:getTmdbImageUrl(movie.backdrop_path),overview:movie.overview,release_date:movie.release_date,vote_average:movie.vote_average})
const createId = () => globalThis.crypto.randomUUID()
const parseNumber = (value) => { const nextValue = Number(value); return Number.isFinite(nextValue) ? nextValue : null }
const normalizeWatchedYear = (value, fallback = null) => { if (value === undefined) return fallback; if (value === null || value === '') return null; const year = Number(value); const maxYear = new Date().getFullYear()+1; return Number.isInteger(year) && year >= 1900 && year <= maxYear ? year : fallback }
const parseTmdbPage = (value) => { const nextPage = Number.parseInt(value,10); return Number.isInteger(nextPage)&&nextPage>0?Math.min(nextPage,500):1 }
const roundToTwo = (value) => Math.round(value*100)/100
const isValidDateValue = (value) => !Number.isNaN(new Date(value).getTime())
const normalizeBoardCover = (cover={}) => ({template:cover.template??'green-book',title:cover.title??'Vision Board',subtitle:cover.subtitle??'Je construis ma vie avec intention.',year:cover.year??'2026',author:cover.author??'Carnet personnel',palette:cover.palette??'#aeb98f',accent:cover.accent??'#2c79c1',sticker:cover.sticker??'✦',imageSrc:cover.imageSrc??''})
const normalizeBoardCanvas = (canvas={}) => ({width:parseNumber(canvas.width)??1280,height:parseNumber(canvas.height)??720,background:canvas.background??'#fffdf7',accent:canvas.accent??'#2c79c1',paperStyle:canvas.paperStyle??'scrapbook-template',templateImageSrc:canvas.templateImageSrc??'/media/visionboard-template-blank-scrapbook.jpg'})
const buildNotesSummary = (items) => { const gradedItems=items.filter((item)=>typeof item.grade==='number'); if(!gradedItems.length)return{average:null,totalNotes:items.length,bySemester:[]}; const totalWeighted=gradedItems.reduce((s,i)=>s+i.grade*i.coefficient,0); const totalCoefficients=gradedItems.reduce((s,i)=>s+i.coefficient,0); const semesterMap=new Map(); gradedItems.forEach((item)=>{const current=semesterMap.get(item.semester)??{semester:item.semester,totalWeighted:0,totalCoefficients:0,count:0};current.totalWeighted+=item.grade*item.coefficient;current.totalCoefficients+=item.coefficient;current.count+=1;semesterMap.set(item.semester,current)});return{average:totalCoefficients?roundToTwo(totalWeighted/totalCoefficients):null,totalNotes:items.length,bySemester:[...semesterMap.values()].sort((a,b)=>a.semester.localeCompare(b.semester)).map((i)=>({semester:i.semester,average:i.totalCoefficients?roundToTwo(i.totalWeighted/i.totalCoefficients):null,count:i.count}))}}

const parseCsvRows = (value) => {
  const text = String(value ?? '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (quoted) {
      if (character === '"' && nextCharacter === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field !== '' || row.length) {
    row.push(field.replace(/\r$/, ''))
    if (row.some((cell) => cell !== '')) rows.push(row)
  }

  return rows
}

const parseCsvObjects = (value) => {
  const rows = parseCsvRows(value)
  const headers = rows.shift()?.map((header) => header.trim()) ?? []
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

const readLetterboxdCsv = (zip, fileName) => {
  const entry = zip.getEntries().find((item) => {
    const normalizedName = item.entryName.replaceAll('\\', '/')
    return normalizedName === fileName || normalizedName.endsWith(`/${fileName}`)
  })
  return entry ? parseCsvObjects(entry.getData().toString('utf8')) : []
}

const readLetterboxdListCsv = (zip) => {
  const entry = zip.getEntries().find((item) => item.entryName.replaceAll('\\', '/').endsWith('/lists/mes-films-preferes.csv'))
  if (!entry) return []
  const content = entry.getData().toString('utf8')
  const headerIndex = content.indexOf('Position,Name,Year')
  return headerIndex >= 0 ? parseCsvObjects(content.slice(headerIndex)) : []
}

const normalizeLetterboxdTitle = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR')
const letterboxdKey = (row) => row['Letterboxd URI'] || row.URL || `${normalizeLetterboxdTitle(row.Name)}::${row.Year ?? ''}`
const parseLetterboxdRating = (value) => {
  const rating = Number(value)
  return Number.isFinite(rating) && rating >= 0.5 && rating <= 5 ? rating : null
}

const mergeLetterboxdMovie = (collection, row, patch = {}) => {
  const title = String(row.Name ?? '').trim()
  if (!title) return null
  const key = letterboxdKey(row)
  const current = collection.get(key) ?? {
    title,
    year: Number(row.Year) || null,
    letterboxd_uri: row['Letterboxd URI'] || row.URL || '',
    rating: null,
    watched: false,
    watched_date: '',
    watch_count: 0,
    watchlist: false,
    favorite: false,
  }
  collection.set(key, { ...current, ...patch })
  return collection.get(key)
}

const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = []
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor
      cursor += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  })
  await Promise.all(workers)
  return results
}

const callTmdb = async (pathname, searchParams={}) => {
  if (!tmdbApiToken && !tmdbApiKey) throw new Error('TMDB_API_TOKEN ou TMDB_API_KEY manquant sur le serveur')
  const url = new URL(`https://api.themoviedb.org/3${pathname}`)
  Object.entries(searchParams).forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,value)})
  const headers = {accept:'application/json'}
  // Prefer the v3 key when both variables exist, so a newly rotated key is
  // not shadowed by an older Render token. A 32-character hexadecimal value
  // is also accepted under TMDB_API_TOKEN for compatibility with the key
  // already configured on Render.
  if (tmdbApiKey || tmdbTokenLooksLikeV3Key) url.searchParams.set('api_key', tmdbApiKey || tmdbApiToken)
  else if (tmdbApiToken) headers.Authorization = `Bearer ${tmdbApiToken}`
  const response = await fetch(url,{headers})
  if(!response.ok) throw new Error('TMDb indisponible')
  return response.json()
}

const storage = multer.diskStorage({destination:async(_request,_file,callback)=>{try{await fs.mkdir(uploadsDir,{recursive:true});callback(null,uploadsDir)}catch(error){callback(error)}},filename:(_request,file,callback)=>{const extension=path.extname(file.originalname);const baseName=path.basename(file.originalname,extension).replace(/[^a-zA-Z0-9-_]/g,'-');callback(null,`${Date.now()}-${baseName}${extension}`)}})
const upload = multer({storage,limits:{fileSize:250*1024*1024,files:12},fileFilter:(_request,file,callback)=>{const isAccepted=file.mimetype.startsWith('image/')||file.mimetype.startsWith('video/');callback(isAccepted?null:new Error('Seuls les fichiers image et video sont acceptes'),isAccepted)}})
const letterboxdUpload = multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024,files:1},fileFilter:(_request,file,callback)=>{const isAccepted=file.mimetype==='application/zip'||file.originalname.toLowerCase().endsWith('.zip');callback(isAccepted?null:new Error('L export Letterboxd doit etre un fichier ZIP'),isAccepted)}})

const allowedOrigins=(process.env.CORS_ORIGIN??'').split(',').map((origin)=>origin.trim()).filter(Boolean)
app.use(cors({origin:allowedOrigins.length?allowedOrigins:true,credentials:true}))
app.use(express.json({limit:'2mb'}))
app.use('/uploads',express.static(uploadsDir))
app.use('/api/apple-music',createAppleMusicRouter())

app.get('/api/health',(_request,response)=>response.json({ok:true,date:new Date().toISOString(),tmdbConfigured:Boolean(tmdbApiToken||tmdbApiKey)}))
app.get('/api/movies/search',async(request,response,next)=>{try{const query=request.query.q?.trim();if(!query){response.json({items:[]});return}const data=await callTmdb('/search/movie',{query,include_adult:'false',language:'fr-FR',page:'1',region:'FR'});response.json({items:(data.results??[]).map(toTmdbMovieItem)})}catch(error){next(error)}})
app.get('/api/movies/explore',async(request,response,next)=>{try{const mode=request.query.mode??'trending_week';const page=parseTmdbPage(request.query.page);const year=typeof mode==='string'&&mode.startsWith('year_')?mode.replace('year_',''):'';const isYearMode=/^\d{4}$/.test(year);const data=isYearMode?await callTmdb('/discover/movie',{include_adult:'false',include_video:'false',language:'fr-FR',page:String(page),primary_release_year:year,region:'FR',sort_by:'popularity.desc'}):await callTmdb('/trending/movie/week',{language:'fr-FR',page:String(page)});response.json({items:(data.results??[]).map(toTmdbMovieItem),page:data.page??page,total_pages:data.total_pages??1,total_results:data.total_results??0})}catch(error){next(error)}})
app.get('/api/movies/upcoming',async(_request,response,next)=>{try{const data=await callTmdb('/movie/upcoming',{language:'fr-FR',page:'1',region:'FR'});response.json({items:(data.results??[]).map(toTmdbMovieItem)})}catch(error){next(error)}})
app.get('/api/movies',async(_request,response,next)=>{try{response.json({items:(await readMoviesDb()).sort((a,b)=>b.created_at-a.created_at)})}catch(error){next(error)}})
app.post('/api/movies/import-letterboxd',letterboxdUpload.single('export'),async(request,response,next)=>{try{const importToken=process.env.LETTERBOXD_IMPORT_TOKEN;if(importToken&&request.headers['x-import-token']!==importToken){response.status(401).json({error:'Import Letterboxd non autorise'});return}if(!request.file){response.status(400).json({error:'Le fichier ZIP Letterboxd est obligatoire'});return}const zip=new AdmZip(request.file.buffer);const collection=new Map();const ratings=readLetterboxdCsv(zip,'ratings.csv');const watched=readLetterboxdCsv(zip,'watched.csv');const diary=readLetterboxdCsv(zip,'diary.csv');const watchlist=readLetterboxdCsv(zip,'watchlist.csv');ratings.forEach((row)=>{const rating=parseLetterboxdRating(row.Rating);mergeLetterboxdMovie(collection,row,rating===null?{}:{rating})});watched.forEach((row)=>{mergeLetterboxdMovie(collection,row,{watched:true,watched_date:row.Date??''})});diary.forEach((row)=>{const current=mergeLetterboxdMovie(collection,row);const diaryDate=row['Watched Date']||row.Date||'';const rating=parseLetterboxdRating(row.Rating);mergeLetterboxdMovie(collection,row,{watched:true,watch_count:(current?.watch_count??0)+1,watched_date:diaryDate>=(current?.watched_date??'')?diaryDate:(current?.watched_date??''),...(rating===null?{}:{rating})})});watchlist.forEach((row)=>{mergeLetterboxdMovie(collection,row,{watchlist:true})});const profile=readLetterboxdCsv(zip,'profile.csv')[0];const favoriteUris=new Set(String(profile?.['Favorite Films']??'').split(',').map((value)=>value.trim()).filter(Boolean));favoriteUris.forEach((uri)=>{const current=collection.get(uri);if(current)collection.set(uri,{...current,favorite:true})});readLetterboxdListCsv(zip).forEach((row)=>{mergeLetterboxdMovie(collection,row,{favorite:true})});const candidates=[...collection.values()];const existingRecords=await readMoviesDb();const existingIds=new Set(existingRecords.map((movie)=>String(movie.tmdb_id)));const resolved=await mapWithConcurrency(candidates,5,async(item)=>{try{const data=await callTmdb('/search/movie',{query:item.title,year:item.year||undefined,include_adult:'false',language:'fr-FR',page:'1',region:'FR'});const results=data.results??[];const matchingYear=results.find((movie)=>item.year&&String(movie.release_date??'').startsWith(String(item.year)));return{item,movie:matchingYear??results[0]??null}}catch{return{item,movie:null}}});const imported=[];let skipped=0;let unresolved=0;for(const resolvedItem of resolved){const item=resolvedItem.item;const tmdbMovie=resolvedItem.movie;const fallbackUri=item.letterboxd_uri||`${item.title}-${item.year??''}`;const tmdbId=tmdbMovie?.id??`letterboxd:${encodeURIComponent(fallbackUri)}`;if(existingIds.has(String(tmdbId))){skipped+=1;continue}if(!tmdbMovie)unresolved+=1;const importedMovie={id:createId(),tmdb_id:tmdbId,title:tmdbMovie?.title??item.title,poster_url:getTmdbImageUrl(tmdbMovie?.poster_path),backdrop_url:getTmdbImageUrl(tmdbMovie?.backdrop_path),overview:tmdbMovie?.overview??'',release_date:tmdbMovie?.release_date??(item.year?`${item.year}-01-01`:''),category:'cinema',personal_status:item.favorite?'favorites':item.watchlist?'watchlist':'watched',personal_note:'',personal_rating:item.rating,watched_year:normalizeWatchedYear(item.year),source:'letterboxd',source_url:item.letterboxd_uri||null,letterboxd_watch_count:item.watch_count,created_at:Date.parse(item.watched_date)||Date.now()};imported.push(importedMovie);existingIds.add(String(tmdbId))}await writeMoviesDb([...existingRecords,...imported]);response.status(201).json({imported:imported.length,skipped,unresolved,total:candidates.length})}catch(error){next(error)}})
app.post('/api/movies',async(request,response,next)=>{try{const body=request.body??{};if(!body.tmdb_id||!body.title){response.status(400).json({error:'tmdb_id et title sont obligatoires'});return}const records=await readMoviesDb();if(records.find((movie)=>movie.tmdb_id===body.tmdb_id)){response.status(409).json({error:'Ce film est deja dans ton vision board cinema'});return}const item={id:createId(),tmdb_id:body.tmdb_id,title:body.title,poster_url:body.poster_url??null,backdrop_url:body.backdrop_url??null,overview:body.overview??'',release_date:body.release_date??'',category:body.category??'cinema',personal_status:body.personal_status??'watchlist',personal_note:body.personal_note??'',personal_rating:typeof body.personal_rating==='number'&&body.personal_rating>=1&&body.personal_rating<=5?body.personal_rating:null,watched_year:normalizeWatchedYear(body.watched_year),created_at:Date.now()};await writeMoviesDb([...records,item]);response.status(201).json({item})}catch(error){next(error)}})
app.put('/api/movies/:id',async(request,response,next)=>{try{const records=await readMoviesDb();const target=records.find((movie)=>movie.id===request.params.id);if(!target){response.status(404).json({error:'Film introuvable'});return}const body=request.body??{};const item={...target,category:body.category??target.category,personal_status:body.personal_status??target.personal_status,personal_note:body.personal_note??target.personal_note,personal_rating:body.personal_rating===null?null:typeof body.personal_rating==='number'&&body.personal_rating>=1&&body.personal_rating<=5?body.personal_rating:target.personal_rating??null,watched_year:normalizeWatchedYear(body.watched_year,target.watched_year??null)};await writeMoviesDb(records.map((movie)=>movie.id===target.id?item:movie));response.json({item})}catch(error){next(error)}})
app.delete('/api/movies/:id',async(request,response,next)=>{try{const records=await readMoviesDb();const target=records.find((movie)=>movie.id===request.params.id);if(!target){response.status(404).json({error:'Film introuvable'});return}await writeMoviesDb(records.filter((movie)=>movie.id!==target.id));response.status(204).end()}catch(error){next(error)}})

app.get('/api/notes',async(_request,response,next)=>{try{response.json({items:(await readNotesDb()).sort((a,b)=>b.created_at-a.created_at)})}catch(error){next(error)}})
app.get('/api/notes/summary',async(_request,response,next)=>{try{response.json(buildNotesSummary(await readNotesDb()))}catch(error){next(error)}})
app.post('/api/notes',async(request,response,next)=>{try{const grade=parseNumber(request.body?.grade);const coefficient=parseNumber(request.body?.coefficient)??1;const subject=request.body?.subject?.trim();const semester=request.body?.semester?.trim()||'S7';if(!subject){response.status(400).json({error:'subject est obligatoire'});return}const item={id:createId(),code:request.body?.code?.trim()??'',subject,grade,coefficient,semester,result:request.body?.result?.trim()??'',comment:request.body?.comment?.trim()??'',exam_type:request.body?.exam_type?.trim()??'evaluation',created_at:Date.now()};const records=await readNotesDb();await writeNotesDb([...records,item]);response.status(201).json({item})}catch(error){next(error)}})
app.put('/api/notes/:id',async(request,response,next)=>{try{const records=await readNotesDb();const target=records.find((note)=>note.id===request.params.id);if(!target){response.status(404).json({error:'Note introuvable'});return}const item={...target,...request.body,id:target.id,created_at:target.created_at};await writeNotesDb(records.map((note)=>note.id===target.id?item:note));response.json({item})}catch(error){next(error)}})
app.delete('/api/notes/:id',async(request,response,next)=>{try{const records=await readNotesDb();if(!records.find((note)=>note.id===request.params.id)){response.status(404).json({error:'Note introuvable'});return}await writeNotesDb(records.filter((note)=>note.id!==request.params.id));response.status(204).end()}catch(error){next(error)}})

app.get('/api/boards',async(_request,response,next)=>{try{response.json({items:await readBoardsDb()})}catch(error){next(error)}})
app.get('/api/boards/:id',async(request,response,next)=>{try{const item=(await readBoardsDb()).find((board)=>board.id===request.params.id);if(!item){response.status(404).json({error:'Board introuvable'});return}response.json({item})}catch(error){next(error)}})
app.post('/api/boards',async(request,response,next)=>{try{const title=request.body?.title?.trim();if(!title){response.status(400).json({error:'title est obligatoire'});return}const now=new Date().toISOString();const item={id:createId(),title,createdAt:now,updatedAt:now,cover:normalizeBoardCover(request.body?.cover),canvas:normalizeBoardCanvas(request.body?.canvas),elements:Array.isArray(request.body?.elements)?request.body.elements:[]};const records=await readBoardsDb();await writeBoardsDb([item,...records]);response.status(201).json({item})}catch(error){next(error)}})
app.put('/api/boards/:id',async(request,response,next)=>{try{const records=await readBoardsDb();const target=records.find((board)=>board.id===request.params.id);if(!target){response.status(404).json({error:'Board introuvable'});return}const item={...target,title:request.body?.title?.trim()||target.title,updatedAt:new Date().toISOString(),cover:normalizeBoardCover(request.body?.cover??target.cover),canvas:normalizeBoardCanvas(request.body?.canvas??target.canvas),elements:Array.isArray(request.body?.elements)?request.body.elements:target.elements??[]};await writeBoardsDb(records.map((board)=>board.id===item.id?item:board));response.json({item})}catch(error){next(error)}})
app.delete('/api/boards/:id',async(request,response,next)=>{try{const records=await readBoardsDb();if(!records.find((board)=>board.id===request.params.id)){response.status(404).json({error:'Board introuvable'});return}await writeBoardsDb(records.filter((board)=>board.id!==request.params.id));response.status(204).end()}catch(error){next(error)}})

app.get('/api/events',async(_request,response,next)=>{try{response.json({items:(await readEventsDb()).sort((a,b)=>new Date(a.startDate)-new Date(b.startDate))})}catch(error){next(error)}})
app.get('/api/events/:id',async(request,response,next)=>{try{const item=(await readEventsDb()).find((event)=>event.id===request.params.id);if(!item){response.status(404).json({error:'Evenement introuvable'});return}response.json({item})}catch(error){next(error)}})
app.post('/api/events',async(request,response,next)=>{try{const title=request.body?.title?.trim();const startDate=request.body?.startDate;const endDate=request.body?.endDate;if(!title||!isValidDateValue(startDate)||!isValidDateValue(endDate)){response.status(400).json({error:'title, startDate et endDate sont obligatoires'});return}const item={id:createId(),title,description:request.body?.description?.trim()??'',startDate:new Date(startDate).toISOString(),endDate:new Date(endDate).toISOString(),source:request.body?.source?.trim()??'manual',boardId:request.body?.boardId??null,boardElementId:request.body?.boardElementId??null,color:request.body?.color??'#f5a3b7',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};const records=await readEventsDb();await writeEventsDb([...records,item]);response.status(201).json({item})}catch(error){next(error)}})
app.put('/api/events/:id',async(request,response,next)=>{try{const records=await readEventsDb();const target=records.find((event)=>event.id===request.params.id);if(!target){response.status(404).json({error:'Evenement introuvable'});return}const nextStartDate=request.body?.startDate??target.startDate;const nextEndDate=request.body?.endDate??target.endDate;if(!isValidDateValue(nextStartDate)||!isValidDateValue(nextEndDate)){response.status(400).json({error:'Dates invalides'});return}const item={...target,title:request.body?.title?.trim()||target.title,description:request.body?.description?.trim()??target.description,startDate:new Date(nextStartDate).toISOString(),endDate:new Date(nextEndDate).toISOString(),source:request.body?.source?.trim()??target.source,boardId:request.body?.boardId??target.boardId??null,boardElementId:request.body?.boardElementId??target.boardElementId??null,color:request.body?.color??target.color,updatedAt:new Date().toISOString()};await writeEventsDb(records.map((event)=>event.id===item.id?item:event));response.json({item})}catch(error){next(error)}})
app.delete('/api/events/:id',async(request,response,next)=>{try{const records=await readEventsDb();if(!records.find((event)=>event.id===request.params.id)){response.status(404).json({error:'Evenement introuvable'});return}await writeEventsDb(records.filter((event)=>event.id!==request.params.id));response.status(204).end()}catch(error){next(error)}})

app.get('/api/themes/:theme/media',async(request,response,next)=>{try{const theme=toSafeTheme(request.params.theme);const records=await readMediaDb();response.json({items:records.filter((record)=>record.theme===theme).sort((a,b)=>b.createdAt-a.createdAt)})}catch(error){next(error)}})
app.post('/api/themes/:theme/media',upload.array('media',12),async(request,response,next)=>{try{const theme=toSafeTheme(request.params.theme);const records=await readMediaDb();const newItems=(request.files??[]).map((file)=>({id:createId(),theme,name:file.originalname,type:file.mimetype,size:file.size,fileName:file.filename,url:buildPublicUploadUrl(file.filename),createdAt:Date.now()}));await writeMediaDb([...records,...newItems]);response.status(201).json({items:newItems})}catch(error){next(error)}})
app.delete('/api/themes/:theme/media/:id',async(request,response,next)=>{try{const theme=toSafeTheme(request.params.theme);const records=await readMediaDb();const item=records.find((record)=>record.id===request.params.id&&record.theme===theme);if(!item){response.status(404).json({error:'Media introuvable'});return}await writeMediaDb(records.filter((record)=>record.id!==item.id));try{await fs.unlink(path.join(uploadsDir,item.fileName))}catch{}response.status(204).end()}catch(error){next(error)}})

app.use((error,_request,response,_next)=>response.status(500).json({error:error.message||'Erreur serveur'}))
ensureStorage().then(()=>app.listen(port,'0.0.0.0',()=>console.log(`Visionboard API active sur le port ${port}`))).catch((error)=>{console.error('Impossible de demarrer le serveur:',error);process.exit(1)})
