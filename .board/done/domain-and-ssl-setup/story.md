# Story: domain-and-ssl-setup

## 1. Business Logic & Goal
Configure a free domain (e.g. via DuckDNS or Cloudflare) pointing to the VPS IP `89.40.2.120`, issue a trusted Let's Encrypt SSL/TLS certificate using Certbot, and wire the certificate paths into the production Node.js Express backend so the PWA application is securely accessible over HTTPS with zero browser security warnings.

## 2. Technical Architecture
- **DNS / Domain**: Bind public IP `89.40.2.120` to a free domain (DuckDNS / Cloudflare).
- **SSL / Certbot**: Generate Let's Encrypt certificates using standalone Certbot mode (`/etc/letsencrypt/live/...`).
- **Server Environment**: Configure `SSL_KEY_PATH`, `SSL_CERT_PATH`, `ENFORCE_HTTPS=true`, and `PORT=443` in `apps/server/.env.production`.
- **Process Management**: Run the Node.js Express production server on port 443.

## 3. Assumptions & Constraints
- Docker is excluded per user requirements.
- Uses Let's Encrypt free automated SSL certificates.
- The Node.js Express server native HTTPS listener handles TLS termination directly on port 443.

## 4. Ticket Breakdown
- [ ] 009-domain-dns-configuration.md
- [ ] 010-certbot-ssl-issuance.md
- [ ] 011-server-ssl-environment-wiring.md
