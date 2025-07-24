const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT;

// Connect to Database
connectDB();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Mount auth routes under /api/auth to handle /api/auth/signup and /api/auth/login
app.use('/api/auth', authRoutes);
// Mount search routes under /api to handle /api/flights, /api/store-search, etc.
app.use('/api', searchRoutes);

app.listen(PORT, () => {
  console.log(`✈️ Server running on http://localhost:${PORT}`);
});
