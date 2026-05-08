import { http, HttpResponse } from 'msw';
// Stub handlers for the invoicing domain — override in individual tests with server.use()
export const handlers = [
    http.get('/api/clients', () => HttpResponse.json({ data: [], nextCursor: null })),
    http.post('/api/clients', () => HttpResponse.json({ id: 'stub-client-id', name: 'Stub Client' }, { status: 201 })),
    http.get('/api/invoices', () => HttpResponse.json({ data: [], nextCursor: null })),
    http.get('/api/jobs/:id', ({ params }) => HttpResponse.json({ id: params.id, status: 'QUEUED', outputPath: null, error: null })),
];
