import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
} else {
  dotenv.config();
}

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { errorHandler } from './middleware/error';
import { authenticate, AuthRequest } from './middleware/auth';
import mealsRoutes from './routes/meals';
import chatRoutes from './routes/chat';
import userRoutes from './routes/user';
import journalRoutes from './routes/journal';
import { startCronJobs } from './jobs/aggregator';

const app = express();
const port = process.env.PORT || 3000;

// HTTP Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// HTTPS Redirect Middleware for production
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS === 'true') {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/meals', mealsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/journal', journalRoutes);

app.get('/protected', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;

  if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    https.createServer(options, app).listen(PORT, () => {
      console.log(`HTTPS Server is running on port ${PORT}`);
      startCronJobs();
    });
  } else {
    http.createServer(app).listen(PORT, () => {
      console.log(`HTTP Server is running on port ${PORT}`);
      startCronJobs();
    });
  }
}

export default app;
