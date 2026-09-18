import { Router } from 'express'
import { getAppleMusicDeveloperToken } from '../controllers/appleMusic.controller'

export function createAppleMusicRouter() {
  const router = Router()
  router.get('/developer-token', getAppleMusicDeveloperToken)
  return router
}
