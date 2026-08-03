# 010 - Certbot SSL Issuance

## Goal
Install Certbot on the server, issue a Let's Encrypt SSL/TLS certificate for the configured domain, and verify certificate renewal configuration.

## Requirements
1. **Certbot Installation**: Ensure `certbot` is installed on the VPS system (`apt update && apt install -y certbot`).
2. **Certificate Generation**: Run `certbot certonly --standalone -d <DOMAIN_NAME>` to generate trusted `.pem` files in `/etc/letsencrypt/live/<DOMAIN_NAME>/`.
3. **Automated Renewal**: Verify that `certbot renew --dry-run` succeeds for automated certificate maintenance.
