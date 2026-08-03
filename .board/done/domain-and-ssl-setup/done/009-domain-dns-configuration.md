# 009 - Domain & DNS Configuration

## Goal
Set up and verify a public domain name pointing to the VPS IP `89.40.2.120` so that Let's Encrypt can perform ACME domain validation.

## Requirements
1. **Domain Selection**: Register/configure a free domain (e.g., using DuckDNS, Cloudflare, or a custom domain) pointing to `89.40.2.120`.
2. **DNS Verification**: Verify that `dig +short <domain>` or `nslookup <domain>` resolves directly to `89.40.2.120`.
3. **Environment Setup**: Update `.env.production` in `apps/server` with the domain name parameter `DOMAIN_NAME=<your-domain>`.
