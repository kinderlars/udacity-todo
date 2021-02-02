import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = process.env.AUTH_0_JWKS_URL


export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info(`The provided url ${jwksUrl}`)
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  logger.info("Starting token verification")
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  logger.info(`Token provided ${token}`)

  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  const jwtKid = jwt.header.kid
  logger.info(`JWT Kid output ${jwtKid}`)

  const jwksData = await getJwksKeys(jwksUrl)
  logger.info(jwksData)

  const jwksKid = jwksData[0]

  if(!jwtKid === jwksKid)
    throw new Error('Kid properties do not match')

  const cert = jwksData[1]

  logger.info("Verify user token")

  return verify(token,cert,jwt.header[0]) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  // JWT token that the client sends
  const token = split[1]

  return token
}

async function getJwksKeys(jwksUrl: string):Promise<any> {
  const response = await Axios.get(jwksUrl)
  logger.info(`Reading information from ${jwksUrl}`)

  const keys = response.data.keys

  if (!keys || !keys.length)
    return new Error('The JWKS endpoint did not contain any keys');

  const signingKeys = keys.filter(key =>
      key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
      && key.kty === 'RSA' // We are only supporting RSA (RS256)
      && key.kid
      && key.e
      && key.n
      && ((key.x5c && key.x5c.length))  // Has useful public keys
  )

  if (!signingKeys.length)
    return new Error('The JWKS endpoint did not contain any signature verification keys')

  // Read first jwk see explanation here https://auth0.com/docs/tokens/json-web-tokens/json-web-key-sets
  const signedKey = signingKeys[0]
  const cert = certToPEM(signedKey.x5c[0])

  logger.info(cert)

  // const jsonData = `{"cert": "${cert}", "kid": "${signedKey.kid}"}`
  // logger.info(jsonData)

  return [signedKey.kid,cert]
}

// From https://gist.github.com/chatu/7738411c7e8dcf604bc5a0aad7937299
function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}
