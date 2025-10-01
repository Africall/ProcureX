import { http, HttpResponse } from 'msw'
import { dashboardHandlers } from './handlers-dashboard'

// Basic mock endpoints to unblock development. You can extend these later.
export const handlers = [
  ...dashboardHandlers,
  // AI search mock
  http.get('/api/ai/suppliers/search', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    return HttpResponse.json({
      query: q,
      results: [
        { id: 101, name: 'Acme Components', score: 0.92, risk: 12 },
        { id: 102, name: 'Globex Industrial', score: 0.88, risk: 18 },
      ],
    })
  }),

  // AI assistant mock
  http.post('/api/ai/assist', async ({ request }) => {
    const { q } = (await request.json().catch(() => ({}))) as any
    return HttpResponse.json({ answer: `Here’s a summarized insight for: "${q}". Supplier risk stable, on-time trending up, and PO backlog is low.` })
  }),

  // Predictive insights mock
  http.get('/api/suppliers/:id/insights', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      deliveryRisk: 0.14,
      leadTimeDays: 12,
      qualityForecast: 0.96,
      notes: 'Stable supplier with improving on-time performance.',
    })
  }),

  // Marketplace mock
  http.get('/api/marketplace/suppliers', () => {
    return HttpResponse.json([
      { id: 'm1', name: 'Stark Materials', category: 'Metals', rating: 4.6 },
      { id: 'm2', name: 'Wayne Plastics', category: 'Plastics', rating: 4.4 },
      { id: 'm3', name: 'Umbrella Textiles', category: 'Textiles', rating: 4.1 },
    ])
  }),

  // Quick-create PO mock
  http.post('/api/purchase-orders', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    return HttpResponse.json({ id: Math.floor(Math.random() * 10000), ...(body as object) }, { status: 201 })
  }),
]
