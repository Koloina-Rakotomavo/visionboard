import type { Request, Response } from 'express'
import { generateAppleMusicDeveloperToken } from '../../application/apple-music/appleMusicToken.service'

export async function getAppleMusicDeveloperToken(_request: Request, response: Response) {
  try {
    const developerToken = await generateAppleMusicDeveloperToken()

    response.json({ developerToken })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur Apple Music inconnue'

    response.status(500).json({
      error: 'Impossible de generer le developer token Apple Music',
      details: message,
    })
  }
}
