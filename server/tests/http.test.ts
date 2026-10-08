import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { testApp } from './helpers.ts'

const ALLOWED = 'http://localhost:5173'
const app = testApp(undefined, [ALLOWED])

describe('HTTP surface', () => {
  it('answers ping and version', async () => {
    await request(app).get('/ping').expect(200, 'pong')
    const res = await request(app).get('/version').expect(200)
    expect(res.text).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/ping')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-security-policy']).toBeDefined()
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('allows only configured origins', async () => {
    const allowed = await request(app).get('/ping').set('Origin', ALLOWED)
    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED)
    const rejected = await request(app).get('/ping').set('Origin', 'https://evil.example')
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/nope').expect(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })

  it('rejects malformed JSON and oversized bodies', async () => {
    await request(app)
      .post('/cards')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400)
    await request(app)
      .post('/cards')
      .send({ search: 'x'.repeat(200_000) })
      .expect(413)
  })
})
