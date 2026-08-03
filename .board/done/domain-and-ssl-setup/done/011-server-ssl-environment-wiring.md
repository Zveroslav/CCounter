# 011 - Server SSL Environment Wiring

## Goal
Wire the generated Let's Encrypt certificate paths into `apps/server/.env.production` and verify that Express serves the application securely over HTTPS on port 443.

## Requirements
1. **Environment Configuration**: Set `SSL_KEY_PATH`, `SSL_CERT_PATH`, `ENFORCE_HTTPS=true`, and `PORT=443` in `apps/server/.env.production`.
2. **Server Startup**: Start the production server using `NODE_ENV=production PORT=443 npm run start`.
3. **Verification**: Confirm HTTPS access via `curl -I https://<DOMAIN_NAME>` returning `200 OK` with valid TLS certificate and zero browser warnings.
