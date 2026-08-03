# CCounter (Calorie Counter)

AI-powered calorie tracking application that recognizes meals from photos and calculates nutritional value (calories, protein, carbs, fat) using the Gemini API.

## Features
- **Photo Recognition:** Upload a picture of your food and get an instant breakdown of its macros.
- **AI-Powered Analysis:** Leverages Gemini to identify both cooked meals and nutrition labels on packaged foods.
- **Health Warnings:** Get actionable health insights and warnings (e.g., high cholesterol, allergens).

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Prisma (SQLite)
- **AI Integration:** Local Antigravity CLI connected to Gemini API

## Getting Started

### Prerequisites
- Node.js (v18+)
- Local `agy` CLI for AI operations

### Installation

1. Install backend dependencies:
   ```bash
   cd apps/server
   npm install
   ```

2. Initialize database:
   - For Development:
     ```bash
     npx prisma generate
     npx prisma migrate dev
     ```
   - For Production:
     Before starting the application, run:
     ```bash
     npm run db:deploy
     ```
     This safely applies all pending migrations from `prisma/migrations` to your production database (`prod.db`) without data loss or forced schema resets.

3. Setup environment variables (`apps/server/.env`):
   ```env
   CLI_COMMAND_TEMPLATE="/Users/yaroslavkravets/.local/bin/agy --dangerously-skip-permissions --print '{{PROMPT}} Картинка находится по пути: {{IMAGE_PATH}}' --output-format json"
   AI_SYSTEM_PROMPT="Проанализируй изображение. Если это готовое блюдо, определи его и рассчитай примерное количество калорий, белков, жиров и углеводов. Если это упаковка еды, прочитай пищевую ценность с этикетки. Также добавь любые релевантные аннотации (например, жирный соус или много витаминов). Верни только JSON с полями: calories (число), protein (число), carbs (число), fat (число), health_warnings (строка с важными коментариями на твое усмотрение)."
   DATABASE_URL="file:./dev.db"
   ```

### Running the application

From the root directory, simply run:
```bash
make up
```
This will start the backend server on port 3000.

## Usage

Submit an image for analysis:
```bash
curl -X POST http://localhost:3000/api/meals/recognize \
  -F "image=@/path/to/your/image.jpg"
```

Check the status of the recognition job:
```bash
curl -X GET http://localhost:3000/api/meals/jobs/<JOB_ID>
```

## HTTPS Configuration & PWA Security

HTTPS is required for Progressive Web App (PWA) installation and Service Worker functionality.

### 1. Generating Certificates with Let's Encrypt (Certbot)
On your production VPS server:
```bash
sudo apt update
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. Configuring Production Environment
In `apps/server/.env.production`, specify your certificate paths and enable HTTPS enforcement:
```env
NODE_ENV=production
PORT=443
ENFORCE_HTTPS=true
SSL_KEY_PATH="/etc/letsencrypt/live/yourdomain.com/privkey.pem"
SSL_CERT_PATH="/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
```

If `SSL_KEY_PATH` and `SSL_CERT_PATH` are omitted or files do not exist, the server automatically falls back to HTTP.

