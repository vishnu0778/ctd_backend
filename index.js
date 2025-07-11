import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

// ✅ PostgreSQL Connection (Render-safe)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Path setup for ES modules (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Express app
const app = express();
app.use(express.json());

// ✅ CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://react.creativethinkdesign.com',
  'https://ctd-backend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100                  // Limit each IP to 100 requests
});
app.use(limiter);

// ✅ API Routes

app.get('/otherservice', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM otherservice');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in /otherservice:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/services_content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services_content');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in /services_content:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/form_request', async (req, res) => {
  const { name, number, email, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO request_form (name, number, email, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, number, email, message]
    );
    res.status(201).json({ message: 'Form submitted', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error in /form_request:', err.message);
    res.status(500).json({ error: 'Insert failed' });
  }
});



// ✅ Serve frontend React build
app.use(express.static(path.join(__dirname, 'build')));

// ✅ For React Router support (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});









// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
