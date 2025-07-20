const mongoose = require('mongoose');
require('dotenv').config({ path: './flightApi.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini2', {
      useNewUrlParser: true, // these are deprecated in Mongoose 6+ but might be needed for your version
      useUnifiedTopology: true,
    });
    console.log('🍃 MongoDB connected successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;