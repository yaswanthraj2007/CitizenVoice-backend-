//-----------------Block 1: The Import Station (The Tools)------------------------
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Review = require('./models/Review'); 
const User = require('./models/User');

//-----------------Block 2: The Server Initialization------------------------------
const app = express();
const PORT = process.env.PORT || 5000; // ✅ Already deployment ready!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_citizen_key_99';

// 🚀 FIXED FOR DEPLOYMENT: Dynamically allows your local machine AND your future Vercel link
const allowedOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allows requests with no origin (like mobile apps or curl/Postman tools)
    if (!origin) return callback(null, true);
    
    // Allows localhost or any domain containing your project name (e.g., vercel.app)
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app') || origin.includes('netlify.app')) {
      return callback(null, true);
    } else {
      return callback(null, new Error('Blocked by CORS policy architecture!'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log("🛰️ Connected securely to MongoDB Atlas Cloud!"))
  .catch(err => console.error("💥 Cloud database connection failed:", err));

//-----------------Block 3: The Security Guard Middleware---------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: "Access Denied! No authentication token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Session expired or signature invalid. Please sign in again." });
    }
    
    req.user = decodedUser; 
    next(); 
  });
};

//-----------------Block 4: The Leaderboard Feed (GET)------------------------------
app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const allReviews = await Review.find({}).sort({ score: -1, createdAt: -1 });
    res.json(allReviews);
  } catch (err) {
    next(err); 
  }
});

//-----------------Block 4.5: The HeatMap Data Aggregator (GET)--------------------
app.get('/api/heatmap', async (req, res, next) => {
  try {
    const heatmapData = await Review.aggregate([
      {
        $group: {
          _id: "$district",                       
          averageScore: { $avg: "$score" },       
          totalReviews: { $sum: 1 }                
        }
      },
      {
        $project: {
          _id: 0,                                 
          district: "$_id",                       
          averageScore: { $round: ["$averageScore", 1] }, 
          totalReviews: 1
        }
      },
      {
        $sort: { totalReviews: -1 }              
      }
    ]);

    return res.status(200).json(heatmapData);
  } catch (err) {
    console.error("💥 HEATMAP AGGREGATION ERROR:", err);
    next(err);
  }
});

//-----------------Block 5: The Review Submission Endpoint (POST)-------------------
app.post('/api/rate', authenticateToken, async (req, res, next) => {
  try {
    const { office, district, score, anonymous, reviewText } = req.body;
    const citizenEmail = req.user.username;
    if (!office || !district || score === undefined) {
      return res.status(400).json({ 
        message: "Validation Failure: Office name, district location, and ranking metrics are mandatory fields." 
      });
    }

    const newReview = await Review.create({
      office: office.trim(),
      district: district.trim(),
      score: Number(score),
      reviewText: reviewText ? reviewText.trim() : "",
      submittedBy: anonymous ? "Anonymous Citizen" : citizenEmail
    });
    
    return res.status(201).json({ 
      message: "Feedback securely locked inside MongoDB Cloud!", 
      data: newReview 
    });

  } catch (err) {
    console.error("💥 BACKEND POST ERROR:", err);
    next(err);
  }
});

//-----------------Block 6: The Registration Gateway (POST)----------------------
app.post('/api/signup', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if(!username || !password){
      return res.status(400).json({ message: "Username and password are required!" });
    }
    if(password.length < 6){
      return res.status(400).json({ message: "Password must be at least 6 characters long!" });
    }

    const userExists = await User.findOne({ username: username.toLowerCase().trim()});
    if (userExists) {
      return res.status(400).json({ message: "Username already taken!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword
    });

    res.status(201).json({ message: "Citizen profile created cleanly in the cloud! Go ahead and sign in." });
  } catch (err) {
    console.error("❌ SIGNUP ERROR DETECTED:", err);
    next(err);
  }
});

//-----------------Block 7: The Login Portal (POST)--------------------------------
app.post('/api/signin', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if(!username || !password){
      return res.status(401).json({ message: "Username and password are required!" });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim()});
    if (!user) {
      return res.status(401).json({ message: "User account not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials entered!" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: "Access granted! Welcome back.",
      token,
      username: user.username
    });
  } catch (err) {
    console.error("❌ SIGNIN ERROR DETECTED:", err); 
    next(err);
  }
});

// Global Fallback Error Handler
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Application Error Framework:", err.stack);
  res.status(500).json({ 
    message: "An unexpected processing error occurred on our server cluster.",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

//-----------------Block 8: The Server Ignition------------------------------------
app.listen(PORT, () => {
  console.log(`🔥 Server is awake and operating cloud pipelines on port: ${PORT}`);
});
