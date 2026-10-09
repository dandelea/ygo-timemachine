import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/serverless.ts'
import { resetDatabase } from './helpers.ts'

beforeAll(resetDatabase)

describe('serverless app', () => {
  it('serves the API under /api', async () => {
    const res = await request(app).get('/api/stats').expect(200)
    expect(res.body).toMatchObject({ pageSize: 36 })
    await request(app).post('/api/cards').send({}).expect(200)
    await request(app).get('/api/missing').expect(404)
  })

  it('serves nothing outside /api', async () => {
    await request(app).get('/stats').expect(404)
  })
})
