import 'dotenv/config';
import express, { Request, Response } from 'express';
import { errorHandler } from './middleware/error';
import { authenticate, AuthRequest } from './middleware/auth';
import mealsRoutes from './routes/meals';

const app = express();
app.use(express.json());

app.use('/api/meals', mealsRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running' });
});

app.get('/protected', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Global error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
