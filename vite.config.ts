// Vite build configuration for Saans application.
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Vite dev plugin mounting serverless /api handlers as local dev middleware. */
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          const modPath = req.url.startsWith('/api/ai-status')
            ? '/api/ai-status.ts'
            : '/api/ai.ts';
          const mod = await server.ssrLoadModule(modPath);
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const raw = ['GET', 'HEAD'].includes(req.method ?? '') ? undefined : Buffer.concat(chunks);
          const origin = `http://${req.headers.host ?? 'localhost:5173'}`;
          const webReq = new Request(`${origin}${req.url}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: raw?.length ? raw : undefined,
            duplex: raw?.length ? 'half' : undefined,
          } as RequestInit);
          const handler = mod[req.method ?? 'GET'];
          const webRes: Response = handler
            ? await handler(webReq)
            : new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
              });
          res.statusCode = webRes.status;
          webRes.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await webRes.arrayBuffer()));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevPlugin()],
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
  };
});
