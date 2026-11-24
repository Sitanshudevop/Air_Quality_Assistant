/**
 * Dedicated mock server running in a Worker thread.
 * Guarantees that subprocesses running spawnSync can communicate over HTTP
 * without blocking the mock server's event loop.
 */
import http from 'node:http';
import { parentPort, workerData } from 'node:worker_threads';

const {
  statusConfigured = true,
  provenanceSource = 'gemini',
  hanging = false,
  omitSecurityHeaders = false,
  staticAssetCaching = true
} = workerData || {};

let hangCount = 0;
const server = http.createServer(async (req, res) => {
  if (hanging) {
    if (hangCount === 0) {
      hangCount++;
      return; // Deliberately hang until client timeout (15s)
    } else {
      req.socket.destroy();
      return;
    }
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (!omitSecurityHeaders) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self)');
  }

  if (url.pathname === '/api/ai-status') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify({ configured: statusConfigured }));
    } else {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    return;
  }

  if (url.pathname === '/api/ai') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks).toString('utf8');

      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      if (!parsed || !parsed.task || parsed.task !== 'indoor-tips' || !parsed.context) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Validation failed' }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        task: 'indoor-tips',
        result: {
          tips: ['Keep windows sealed', 'Use wet mopping'],
          urgency: 'high'
        },
        provenance: {
          source: provenanceSource,
          model: 'gemini-2.5-flash',
          cached: false
        }
      }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    if (staticAssetCaching) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    res.setHeader('Content-Type', 'application/javascript');
    res.statusCode = 200;
    res.end('/* static asset bundle */');
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
  res.statusCode = 200;
  res.end('<!DOCTYPE html><html><head><title>Saans</title></head><body><div id="root"></div></body></html>');
});

server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  parentPort.postMessage({ type: 'ready', port });
});

parentPort.on('message', (msg) => {
  if (msg === 'close') {
    server.close(() => {
      process.exit(0);
    });
  }
});
