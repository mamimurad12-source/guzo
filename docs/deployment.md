# Deployment

This repository is designed for production deployment with a Node.js backend, PostgreSQL, Expo mobile apps, and a web-admin deployment target.

## Recommended stack

- Backend: Node.js + Render / Railway / Azure App Service / VPS
- Database: managed PostgreSQL
- Mobile: Expo EAS Build
- Admin: Vercel / Netlify / static hosting for the Vite app

## Required items before production

- Secure environment variables
- Provider API credentials
- Signed webhook secret management
- Monitoring and logs
- Database backups
