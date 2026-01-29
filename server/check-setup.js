const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('\n🔧 SecureEval - System Setup Verification\n');
console.log('==========================================\n');

async function checkMongoDB() {
    try {
        console.log('📊 Checking MongoDB connection...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secureeval';
        const client = new MongoClient(uri);
        await client.connect();
        await client.db().admin().serverStatus();
        await client.close();
        console.log('✅ MongoDB: Connected successfully!\n');
        return true;
    } catch (error) {
        console.log('❌ MongoDB: Connection failed');
        console.log(`   Error: ${error.message}`);
        console.log('   Fix: Make sure MongoDB is running or check MONGODB_URI in .env\n');
        return false;
    }
}

async function checkEmail() {
    try {
        console.log('📧 Checking email configuration...');

        if (!process.env.SMTP_USER) {
            console.log('⚠️  SMTP credentials not configured');
            console.log('   Creating test email account (Ethereal)...');
            const testAccount = await nodemailer.createTestAccount();
            console.log('✅ Email: Test account created!');
            console.log(`   User: ${testAccount.user}`);
            console.log(`   Pass: ${testAccount.pass}`);
            console.log(`   Preview: https://ethereal.email\n`);
            return true;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.verify();
        console.log('✅ Email: SMTP configured and verified!\n');
        return true;
    } catch (error) {
        console.log('❌ Email: Configuration failed');
        console.log(`   Error: ${error.message}`);
        console.log('   Fix: Check SMTP settings in .env file\n');
        return false;
    }
}

function checkEnv() {
    console.log('🔐 Checking environment variables...');
    const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.log('❌ Missing environment variables:');
        missing.forEach(key => console.log(`   - ${key}`));
        console.log('   Fix: Add these to your .env file\n');
        return false;
    }

    console.log('✅ Environment: All required variables set!\n');
    return true;
}

async function main() {
    const envOk = checkEnv();
    const mongoOk = await checkMongoDB();
    const emailOk = await checkEmail();

    console.log('==========================================\n');

    if (envOk && mongoOk && emailOk) {
        console.log('🎉 All systems ready!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run dev:all');
        console.log('2. Open: http://localhost:5173');
        console.log('3. Register a new account');
        console.log('4. Check your email for OTP!\n');
    } else {
        console.log('⚠️  Setup incomplete. Please fix the issues above.\n');
        process.exit(1);
    }
}

main().catch(console.error);
