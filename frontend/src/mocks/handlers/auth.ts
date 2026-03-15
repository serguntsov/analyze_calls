import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    if (body.password === 'wrong') {
      return HttpResponse.json({ message: 'Неверный логин или пароль' }, { status: 401 });
    }
    return HttpResponse.json({
      token: 'mock-token-123',
      user: { id: '1', name: body.username || 'Пользователь' },
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    return HttpResponse.json({
      token: 'mock-token-456',
      user: { id: '2', name: body.username || 'Новый пользователь' },
    });
  }),
];
