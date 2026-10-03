import { Hono } from 'hono';

export const app = new Hono().basePath('/v1');

// Placeholder: WS2 extends this to the full contract ({ ok, nfz, snapshotAsOf }).
app.get('/health', (c) => c.json({ ok: true }));
