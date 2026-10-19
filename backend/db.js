const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI not found in environment variables. Running in in-memory mode.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    isConnected = false;
    return null;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB connection lost. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ MongoDB connection restored.');
});

function getDBStatus() {
  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return {
    connected: readyState === 1,
    isConnected: readyState === 1,
    state: readyState === 1 ? 'connected' : 'disconnected',
    readyState,
    statusText: readyState === 1 ? 'Connected' : readyState === 2 ? 'Connecting' : 'Disconnected',
    host: mongoose.connection.host || 'cluster0.bjsv7px.mongodb.net',
    database: mongoose.connection.name || 'craftykidsco'
  };
}

module.exports = {
  connectDB,
  getDBStatus,
  mongoose
};
