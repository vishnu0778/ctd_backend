import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import cors from 'cors';


dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Render requires SSL
  }
});

const app = express();
app.use(express.json());

// app.use(cors({
//   origin: 'https://ctd-backend.onrender.com', // Allow frontend
//   credentials: true
// }));


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

app.get('/otherservice', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM otherservice');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Query error:', error.message); // 👈 shows the actual reason
    res.status(500).json({ error: error.message });   // 👈 shows in browser/postman
  }
});



app.get('/services_content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services_content');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Query error:', error.message); // 👈 shows the actual reason
    res.status(500).json({ error: error.message });   // 👈 shows in browser/postman
  }
});

app.post('/form_request', async (req, res) => {
  const { name, number, email, message } = req.body;
  console.log(req.body, "Request Body");

  try {
    const result = await pool.query(
      'INSERT INTO request_form (name, number, email, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, number, email, message]
    );
    res.status(201).json({ message: 'Form submitted successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error inserting into request_form:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});







const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
