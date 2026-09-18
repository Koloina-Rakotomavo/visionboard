export type AppleMusicEnv = {
  appleKeyId: string
  applePrivateKey: string
  appleTeamId: string
  corsOrigin?: string
  port: number
}

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, '\n')

const readRequiredEnv = (name: string) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`)
  }

  return value
}

export const getAppleMusicEnv = (): AppleMusicEnv => ({
  appleKeyId: readRequiredEnv('APPLE_KEY_ID'),
  applePrivateKey: normalizePrivateKey(readRequiredEnv('APPLE_PRIVATE_KEY')),
  appleTeamId: readRequiredEnv('APPLE_TEAM_ID'),
  corsOrigin: process.env.APPLE_MUSICKIT_MEDIA_API_TOKEN_ORIGIN,
  port: Number(process.env.PORT) || 3001,
})
