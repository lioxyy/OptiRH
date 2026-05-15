import express from 'express';

export function createApp() {
    const app = express();
    app.get('/api/health', (req, res) => {
        res.json({ ok: true });
    });
    return app;
}
