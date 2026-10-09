import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import handler from '../src/serverless.ts'
import { resetDatabase } from './helpers.ts'

beforeAll(resetDatabase)

describe('serverless handler', () => {
  it('serves the API under /api', async () => {
    const res = await request(handler).get('/api/stats').expect(200)
    expect(res.body).toMatchObject({ pageSize: 36 })
    await request(handler).post('/api/cards').send({}).expect(200)
  })

  it('keeps query strings and paths without the prefix', async () => {
    await request(handler).get('/api?x=1').expect(404)
    await request(handler).get('/stats').expect(200)
    await request(handler).get('/apis').expect(404)
  })
})
