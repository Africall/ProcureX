import request from 'supertest'
import app from '../src/index'

function getCookie(res: request.Response, name: string){
  const raw = res.headers['set-cookie'] as string[] | undefined
  if(!raw) return ''
  const found = raw.find(c=> c.startsWith(name+'='))
  return found ? found.split(';')[0].split('=')[1] : ''
}

describe('Security flows', ()=>{
  it('register -> login -> change-password -> login with new -> logout-all -> old token rejected', async ()=>{
    const agent = request.agent(app)
    // register
    const email = `u${Date.now()}@ex.com`
    const password = 'Abcd!2345678'
    const reg = await agent.post('/auth/register').send({ email, password })
    expect(reg.status).toBe(201)
    const csrf = getCookie(reg, 'csrf_token')
    expect(csrf).toBeTruthy()

    // change password
    const ch = await agent.post('/auth/change-password').set('X-CSRF-Token', csrf).send({ currentPassword: password, newPassword: 'NewP@ssw0rd123' })
    expect(ch.status).toBe(200)

    // logout-all
    const la = await agent.post('/api/auth/logout-all').set('X-CSRF-Token', csrf)
    expect(la.status).toBe(200)

    // old cookie should be invalid now for protected endpoint
    const me1 = await agent.get('/api/auth/me')
    expect(me1.status).toBe(401)

    // login with new password
    const lg = await agent.post('/auth/login').send({ email, password: 'NewP@ssw0rd123' })
    expect(lg.status).toBe(200)
  })

  it('rejects CSRF when missing token on mutating route', async ()=>{
    const agent = request.agent(app)
    const email = `c${Date.now()}@ex.com`
    const password = 'Abcd!2345678'
    await agent.post('/auth/register').send({ email, password })
    const res = await agent.post('/auth/change-password').send({ currentPassword: password, newPassword: 'NewP@ssw0rd123' })
    expect(res.status).toBe(403)
  })
})
