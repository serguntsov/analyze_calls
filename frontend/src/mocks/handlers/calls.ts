import { http, HttpResponse } from 'msw';
import { mockCallDetails, mockCalls } from '../data/calls';

export const callsHandlers = [
  http.get('/api/calls', ({ request }) => {
    const url    = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    const topic  = url.searchParams.get('topic') ?? '';
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo   = url.searchParams.get('dateTo');

    let items = [...mockCalls];

    if (search) {
      items = items.filter(c => c.filename.toLowerCase().includes(search));
    }
    if (topic) {
      items = items.filter(c => c.topics.some(t => t.toLowerCase().includes(topic.toLowerCase())));
    }
    if (dateFrom) {
      items = items.filter(c => new Date(c.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      items = items.filter(c => new Date(c.date) <= new Date(dateTo + 'T23:59:59Z'));
    }

    return HttpResponse.json({ items, total: items.length });
  }),

  http.get('/api/calls/:id', ({ params }) => {
    const { id } = params as { id: string };
    const detail = mockCallDetails[id];
    if (!detail) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(detail);
  }),

  http.post('/api/calls/upload', async () => {
    await new Promise(r => setTimeout(r, 800));
    return HttpResponse.json({
      id: String(Date.now()),
      filename: 'new_call.mp3',
      date: new Date().toISOString(),
      duration: 0,
      topics: [],
      status: 'queued',
      operator: '',
    });
  }),
];
