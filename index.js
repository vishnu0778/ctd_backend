import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();

const { Pool } = pg;

// app.set('trust proxy', 1);


// ✅ PostgreSQL Connection (Render-safe)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


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


// ✅ General API limiter (e.g. for public GET routes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // more generous
  message: "Too many requests, try again later."
});

// ✅ For general GET routes (like fetching data)
const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Allow more because many assets or users hit GETs
  message: "Too many GET requests. Please slow down."
});

// ✅ For POST routes (like contact forms)
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter to prevent abuse
  message: "Too many form submissions. Try again later."
});

// ✅ Apply limiters only where needed
app.get('/otherservice', getLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM otherservice');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in /otherservice:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/services_content', getLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services_content');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error in /services_content:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/form_request', postLimiter, async (req, res) => {
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




// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
