import fastify from 'fastify'
import { Server } from './types'
import middie from 'middie'
import fastifyCookie from 'fastify-cookie'
import jwt from 'jsonwebtoken'
import { EventStore, Event } from '@pun-ci/eventstore'

export const COOKIE_ID = 'punci_token'

type SessionParams = {
    githubToken: string
    userId: string
}

type SessionCreated = Event<'SessionCreated', SessionParams>
type SessionDeleted = Event<'SessionDeleted', never>
type SessionEvent = SessionCreated | SessionDeleted

export const createServer = (jwtSecret: string, eventStore: EventStore): Server => ({
    nonAuth: async () => {
        return await fastify()
    },
    auth: async () => {
        const server = fastify()
        await server.register(middie)
        await server.register(fastifyCookie)
        server.addHook('onRequest', async (request, reply) => {
            if (!request.cookies || !request.cookies[COOKIE_ID]) {
                reply.statusCode = 401
                return
            }
            const token = String(request.cookies[COOKIE_ID])
            try {
                jwt.verify(token, jwtSecret)
            } catch (err) {
                reply.statusCode = 401
                return
            }

            const stream = eventStore.stream<SessionEvent>(`session:${token}`)
            const githubToken = await stream.reduce<string | null>(null, {
                SessionCreated: ({ githubToken }) => githubToken,
                SessionDeleted: () => null
            })
            if (githubToken === null) {
                reply.statusCode = 401
            }
        })
        return await server
    }
})
