import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getAppleMusicEnv } from './config/env'
import { createAppleMusicRouter } from './presentation/routes/appleMusic.routes'

const app = express()
let port = 3001
try {
  const env = getAppleMusicEnv()
  port = env.port
  app.use(cors({ origin: env.corsOrigin || true }))
} catch {
  app.use(cors())
}
app.use(express.json())
app.get('/api/health', (_request, response) => response.json({appleMusicConfigured:Boolean(process.env.APPLE_TEAM_ID&&process.env.APPLE_KEY_ID&&process.env.APPLE_PRIVATE_KEY),ok:true}))
app.use('/api/apple-music', createAppleMusicRouter())
app.use((error,_request,response,_next)=>response.status(500).json({error:error instanceof Error?error.message:'Erreur serveur inconnue'}))
app.listen(port,()=>console.log(`Apple Music auth server running on http://localhost:${port}`))
