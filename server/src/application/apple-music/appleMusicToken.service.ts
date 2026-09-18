import { SignJWT, importPKCS8 } from 'jose'
import { getAppleMusicEnv } from '../../config/env'

const SIX_MONTHS_IN_SECONDS = 15777000

export async function generateAppleMusicDeveloperToken() {
  const { appleKeyId, applePrivateKey, appleTeamId } = getAppleMusicEnv()
  const privateKey = await importPKCS8(applePrivateKey, 'ES256')
  const issuedAt = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({
      alg: 'ES256',
      kid: appleKeyId,
    })
    .setIssuer(appleTeamId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SIX_MONTHS_IN_SECONDS)
    .sign(privateKey)
}
