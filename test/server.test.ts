import { createServer } from '../src'
import { sign } from 'jsonwebtoken'
import { inMemoryEventStore } from '@pun-ci/eventstore'

const JWT_SECRET = 'My baby\'s got a secret'

const createInstance = async () => {
    return createServer(JWT_SECRET, await inMemoryEventStore())
}

describe('Server without auth', () => {
    it('Simple response', async () => {
        const server = await (await createInstance()).nonAuth()
        server.get('/', async () => ({ test: 'OK' }))
        const responseOk = await server.inject({
            method: 'GET',
            url: '/'
        })
        const responseNotFound = await server.inject({
            method: 'GET',
            url: '/non-existent'
        })
        expect(responseOk.statusCode).toBe(200)
        expect(JSON.parse(responseOk.body)).toStrictEqual({ test: 'OK' })
        expect(responseNotFound.statusCode).toBe(404)
    })
})

describe('Server with auth', () => {
    it('Unauthorized when no cookie is set', async () => {
        const server = await (await createInstance()).auth()
        server.get('/', async () => ({}))
        const response = await server.inject({
            method: 'GET',
            url: '/'
        })
        expect(response.statusCode).toBe(401)
    })

    it('Unauthorized when cookie is invalid', async () => {
        const server = await (await createInstance()).auth()
        server.get('/', async () => ({}))
        const response = await server.inject({
            method: 'GET',
            url: '/',
            cookies: {
                punci_token: 'INVALID'
            }
        })
        expect(response.statusCode).toBe(401)
    })

    it('Unauthorized when cookie contains a nonexistent session id', async () => {
        const server = await (await createInstance()).auth()
        server.get('/', async () => ({}))
        const response = await server.inject({
            method: 'GET',
            url: '/',
            cookies: {
                punci_token: sign({ sessionId: 'NON-EXISTENT-SESSION-ID' }, JWT_SECRET)
            }
        })
        expect(response.statusCode).toBe(401)
    })
})
