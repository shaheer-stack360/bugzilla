import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './db/connection.js';
import { login, register } from './controllers/auth.controller.js';
import bugRoutes from './routes/bugs.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;  

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Bugzilla API is running',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
      bugs: 'GET /bugs'
    }
  });
});

// Auth routes
app.post('/login', login);
app.post('/register', register); // Add register route

// Bug routes
app.use('/bugs', bugRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();