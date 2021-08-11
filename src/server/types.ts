import { FastifyInstance } from 'fastify'

export interface Server {
    nonAuth: () => Promise<FastifyInstance>
    auth: () => Promise<FastifyInstance>
}
