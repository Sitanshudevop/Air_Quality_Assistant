/**
 * Server harness for opaque-box E2E testing.
 * Provides ephemeral in-process HTTP servers on 127.0.0.1:0 for wire-testing
 * serverless handlers (api/ai.ts and api/ai-status.ts) and deployment smoke tests.
 */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';
import { Worker } from 'node:worker_threads';
import { WORKSPACE_ROOT } from './workspace-inspect.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register TypeScript NodeNext .js -> .ts resolver hook
if (!globalThis.__tsResolverRegistered) {
  try {
    const resolverUrl = pathToFileURL(path.resolve(WORKSPACE_ROOT, 'tests/e2e/helpers/ts-resolver.mjs')).href;
    register(resolverUrl, pathToFileURL(WORKSPACE_ROOT + '/').href);
    globalThis.__tsResolverRegistered = true;
  } catch {
    // Ignore if already registered
  }
}

/**
 * Starts an ephemeral HTTP server on 127.0.0.1:0 wrapping api/ai.ts and api/ai-status.ts
 * @param {object} [options]
 * @param {string} [options.apiDir]
 * @returns {Promise<{ origin: string, port: number, server: http.Server, close: () => Promise<void>, reload: () => Promise<void> }>}
 */
export async function startServerlessHarness(options = {}) {
  const apiDir = options.apiDir || path.resolve(WORKSPACE_ROOT, 'api');
  const aiPath = path.resolve(apiDir, 'ai.ts');
  const statusPath = path.resolve(apiDir, 'ai-status.ts');

  let aiModule = null;
  let statusModule = null;

  async function loadHandlers() {
    if (fs.existsSync(statusPath)) {
      try {
        statusModule = await import(pathToFileURL(statusPath).href + `?t=${Date.now()}`);
      } catch (err) {
        statusModule = { __loadError: err };
      }
    }
    if (fs.existsSync(aiPath)) {
      try {
        aiModule = await import(pathToFileURL(aiPath).href + `?t=${Date.now()}`);
      } catch (err) {
        aiModule = { __loadError: err };
      }
    }
  }

  await loadHandlers();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);

      // Convert Node HTTP request to Web Standard Request
      const webReq = new Request(url.toString(), {
        method: req.method,
        headers: req.headers,
        body: rawBody && rawBody.length > 0 ? rawBody : undefined,
        duplex: rawBody && rawBody.length > 0 ? 'half' : undefined
      });

      let webRes;
      if (url.pathname === '/api/ai-status') {
        if (!statusModule || statusModule.__loadError) {
          // If module isn't loaded yet, return 503 or error
          const errDetail = statusModule?.__loadError?.message || 'ai-status handler not available';
          webRes = new Response(JSON.stringify({ error: errDetail }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        } else if (req.method === 'GET' && typeof statusModule.GET === 'function') {
          webRes = await statusModule.GET(webReq);
        } else if (typeof statusModule[req.method] === 'function') {
          webRes = await statusModule[req.method](webReq);
        } else {
          webRes = new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        }
      } else if (url.pathname === '/api/ai') {
        if (!aiModule || aiModule.__loadError) {
          const errDetail = aiModule?.__loadError?.message || 'ai handler not available';
          webRes = new Response(JSON.stringify({ error: errDetail }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        } else if (req.method === 'POST' && typeof aiModule.POST === 'function') {
          webRes = await aiModule.POST(webReq);
        } else if (typeof aiModule[req.method] === 'function') {
          webRes = await aiModule[req.method](webReq);
        } else {
          webRes = new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        }
      } else {
        webRes = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      res.statusCode = webRes.status;
      for (const [key, value] of webRes.headers.entries()) {
        res.setHeader(key, value);
      }
      const arrayBuf = await webRes.arrayBuffer();
      res.end(Buffer.from(arrayBuf));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr.port;
      const origin = `http://127.0.0.1:${port}`;
      resolve({
        origin,
        port,
        server,
        reload: loadHandlers,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

/**
 * Starts a controlled mock deployment server simulating a deployed Vercel instance.
 * Runs in a separate Worker thread so that spawnSync subprocesses do not block its event loop.
 * Used for testing scripts/smoke-deployed.mjs under various deployment scenarios.
 * @param {object} [options]
 * @param {boolean} [options.statusConfigured=true]
 * @param {string} [options.provenanceSource='gemini']
 * @param {boolean} [options.hanging=false]
 * @param {boolean} [options.omitSecurityHeaders=false]
 * @param {boolean} [options.staticAssetCaching=true]
 * @returns {Promise<{ origin: string, port: number, worker: Worker, close: () => Promise<void> }>}
 */
export async function startMockDeployServer(options = {}) {
  const workerPath = path.resolve(__dirname, 'mock-deploy-worker.mjs');
  const worker = new Worker(workerPath, { workerData: options });

  return new Promise((resolve, reject) => {
    worker.on('message', (msg) => {
      if (msg.type === 'ready') {
        const port = msg.port;
        const origin = `http://127.0.0.1:${port}`;
        resolve({
          origin,
          port,
          worker,
          close: () =>
            new Promise((done) => {
              worker.on('exit', () => done());
              worker.postMessage('close');
            })
        });
      }
    });
    worker.on('error', reject);
  });
}
