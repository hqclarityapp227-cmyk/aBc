import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function netlifyFunctionsDevPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/.netlify/functions/validate-license') || url.startsWith('/api/validate-license')) {
          try {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            req.on('end', async () => {
              const bodyStr = Buffer.concat(chunks).toString('utf-8');
              let parsedBody: any = {};
              try {
                parsedBody = JSON.parse(bodyStr || '{}');
              } catch {
                parsedBody = {};
              }

              const key = parsedBody.key || parsedBody.licenseKey || parsedBody.license_key || '';
              const trimmedKey = String(key || '').trim();

              if (!trimmedKey) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(JSON.stringify({
                  valid: false,
                  status: 'invalid',
                  message: 'License key is required.'
                }));
                return;
              }

              const whopApiKey = process.env.WHOP_API_KEY || process.env.WHOP_API_TOKEN;
              if (!whopApiKey) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(500);
                res.end(JSON.stringify({
                  valid: false,
                  status: 'error',
                  message: 'Server error: WHOP_API_KEY environment variable is not configured.'
                }));
                return;
              }

              try {
                const cleanKey = encodeURIComponent(trimmedKey);
                let whopResp = await fetch(`https://api.whop.com/api/v5/licenses/${cleanKey}`, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${whopApiKey.trim()}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (whopResp.status === 404) {
                  whopResp = await fetch(`https://api.whop.com/api/v2/memberships/${cleanKey}`, {
                    method: 'GET',
                    headers: {
                      Authorization: `Bearer ${whopApiKey.trim()}`,
                      'Content-Type': 'application/json',
                    },
                  });
                }

                if (whopResp.ok) {
                  const data: any = await whopResp.json();
                  const rawStatus = (data.status || (data.valid === true ? 'active' : '') || '').toLowerCase();
                  const isActive = rawStatus === 'active' || rawStatus === 'valid' || data.valid === true || rawStatus === 'past_due';
                  const isExpired = rawStatus === 'expired' || rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'terminated' || rawStatus === 'deleted';

                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  if (isActive && !isExpired) {
                    res.end(JSON.stringify({
                      valid: true,
                      status: 'valid',
                      key: trimmedKey,
                      message: 'Whop license verified successfully.'
                    }));
                  } else {
                    res.end(JSON.stringify({
                      valid: false,
                      status: isExpired ? 'expired' : 'invalid',
                      message: isExpired ? 'This Whop license key has expired or was cancelled.' : `License status is "${rawStatus || 'inactive'}". Please renew on Whop.`
                    }));
                  }
                  return;
                }

                if (whopResp.status === 404) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(JSON.stringify({
                    valid: false,
                    status: 'invalid',
                    message: 'Invalid license key. This key was not found on Whop.'
                  }));
                  return;
                }

                if (whopResp.status === 401 || whopResp.status === 403) {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(500);
                  res.end(JSON.stringify({
                    valid: false,
                    status: 'error',
                    message: 'Authentication error: WHOP_API_KEY is invalid.'
                  }));
                  return;
                }

                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({
                  valid: false,
                  status: 'invalid',
                  message: 'Could not verify license key with Whop.'
                }));
              } catch (apiErr) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(500);
                res.end(JSON.stringify({
                  valid: false,
                  status: 'error',
                  message: 'Error communicating with Whop API.'
                }));
              }
            });
            return;
          } catch (e) {
            next();
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), netlifyFunctionsDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
