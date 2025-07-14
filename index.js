import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

dotenv.config();

const { Pool } = pg;

// ✅ Express app
const app = express();

// ✅ Trust proxy (important for platforms like Render)
app.set('trust proxy', 1); // 👈 Place this BEFORE any rate limiter

app.use(express.json());

// ✅ PostgreSQL Connection (Render-safe)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

// ✅ Rate limiters
const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Allow more for GETs
  message: "Too many GET requests. Please slow down."
});

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter for form submissions
  message: "Too many form submissions. Please try again later."
});

// ✅ Routes

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


const sendEmail = async (name, email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password from Google
      },
    });


    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thank You - Creative Think Design</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      background: #ffffff;
      max-width: 600px;
      margin: 10px;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .message {
      margin-top: 20px;
      font-size: 16px;
      color: #333333;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #777777;
    }
    .brand {
      font-weight: bold;
      color: #3498db;
    }
  </style>
</head>
<body>
  <div class="container"> 
    <p class="message">
      Hello <strong>{{name}}!</strong>,<br><br>
      Thank you for showing interest in <strong>Creative Think Design</strong>. Our team has received your message and will reach out to you shortly.<br><br>
      We appreciate your time and look forward to collaborating with you.
    </p>
    <div class="footer">
      &copy; 2020 <a href="http://creativethinkdesign.com" target="_blank">Creative Think Design</a>. All rights reserved.
    </div>
  </div>
</body>
</html>
`;



    const mailOptions = {
      from: `"Creative Think Design" <creativethinkdesign4u@gmail.com>`,
      to: email, // Your email to receive messages
      subject: "Creative Think Design - Thanks for Getting in Touch" || 'New Message',
      // html: `<p><strong>Name:</strong> ${name}</p>
      //        <p><strong>Email:</strong> ${email}</p>
      //        <p><strong>Message:</strong><br/>This message is testing</p>`,
      html: htmlTemplate.replace('{{name}}', name)
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};


app.post('/form_request', postLimiter, async (req, res) => {
  const { name, number, email, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO request_form (name, number, email, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, number, email, message]
    );
    res.status(201).json({ message: 'Form submitted', data: result.rows[0] });
    sendEmail(name, email)
  } catch (err) {
    console.error('❌ Error in /form_request:', err.message);
    res.status(500).json({ error: 'Insert failed' });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
