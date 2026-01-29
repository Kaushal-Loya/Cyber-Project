const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secureeval';

        client = new MongoClient(uri);

        await client.connect();
        db = client.db();

        console.log('✅ MongoDB Connected Successfully');

        // Create indexes
        await createIndexes();

        return db;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
}

async function createIndexes() {
    try {
        // Users collection indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });

        // OTP collection indexes (with TTL for auto-deletion after 10 minutes)
        await db.collection('otps').createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });
        await db.collection('otps').createIndex({ email: 1 });

        // Sessions collection indexes (with TTL for auto-deletion after 24 hours)
        await db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
        await db.collection('sessions').createIndex({ userId: 1 });

        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('⚠️  Index creation error:', error.message);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };
