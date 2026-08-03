# 004 - HTTPS & PWA Security

## Goal
Implement HTTPS on the backend server to ensure secure communication and satisfy the requirement for installing the application as a PWA on mobile devices.

## Requirements
1. **Node.js HTTPS Server**: Modify `apps/server/src/index.ts` to optionally spin up an HTTPS server using the native `https` module if specific environment variables are provided.
   - Example vars: `SSL_KEY_PATH` and `SSL_CERT_PATH`.
   - Read the `.pem` or `.crt`/`.key` files from the filesystem via `fs.readFileSync`.
2. **Fallback to HTTP**: If the SSL certificates are not provided (e.g. in local dev without them), fallback to standard `http.createServer(app)`.
3. **Configuration / Documentation**: Document how to generate Let's Encrypt certificates (e.g., using `certbot`) or self-signed certificates and point the `.env.production` variables to those paths on the VPS.
4. **Enforce HTTPS**: Add a small middleware that redirects HTTP traffic to HTTPS if running in production mode.
