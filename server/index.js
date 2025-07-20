const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Mount auth routes at the root to handle /signup and /login
app.use(authRoutes);
// Mount search routes under /api to handle /api/flights, /api/store-search, etc.
app.use('/api', searchRoutes);

app.listen(PORT, () => {
  console.log(`✈️ Server running on http://localhost:${PORT}`);
});
