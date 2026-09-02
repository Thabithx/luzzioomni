const mongoose = require('mongoose');
const dns = require('dns');

// Ensure Node resolves MongoDB Atlas SRV records using public DNS servers (bypasses ISP/hotspot DNS blocks)
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Disable buffering so DB operations fail immediately when Mongoose is not connected
mongoose.set('bufferCommands', false);

let devMode = false;

async function connectDB() {
   const mongoUri = process.env.MONGO_URI;

   if (!mongoUri) {
      devMode = true;
      console.warn('⚠️ MONGO_URI is not set in environment variables — running in dev/offline mode');
      return;
   }

   try {
      const redacted = mongoUri.replace(/:([^@]+)@/, ':***@');
      console.log(`Connecting to MongoDB: ${redacted}`);
      await mongoose.connect(mongoUri, {
         serverSelectionTimeoutMS: 10000,
         connectTimeoutMS: 10000,
      });
      console.log('✅  Connected to MongoDB successfully');
   } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      devMode = true;
      console.warn('MongoDB unavailable');
   }
}

function isDevStore() {
   return devMode;
}

module.exports = { connectDB, isDevStore };
