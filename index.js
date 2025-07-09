import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';

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


app.get('/otherservice', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM otherservice');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Query error:', error.message); // 👈 shows the actual reason
    res.status(500).json({ error: error.message });   // 👈 shows in browser/postman
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
