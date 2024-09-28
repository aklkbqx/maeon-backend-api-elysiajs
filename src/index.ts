import { Elysia } from 'elysia';
import { log } from 'console';
import cors from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import apiRouteV1 from './routes/v1';
import { swagger } from '@elysiajs/swagger'

const port = process.env.API_PORT || 5001;

const app = new Elysia()
    .use(swagger())
    .use(cors())
    .use(staticPlugin({
        assets: 'public',
        prefix: '/'
    }))
    .get('/test', () => ({ text: 'test' }))
    .group("/api/v1", (app) => app.use(apiRouteV1))
    .onError(({ code, error, set }) => {
        log(`Error ${code}: ${error.message}`);
        set.status = code === 'NOT_FOUND' ? 404 : 500;
        return {
            success: false,
            message: code === 'NOT_FOUND' ? 'Not Found' : 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? null : error.message
        };
    })
    .listen(port, () => {
        log(`🦊 Elysia is running at http://localhost:${port}`);
    });

export default app;