const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const emailService = require('../services/emailService');

const router = express.Router();

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
    );
}

/**
 * REGISTER - Create new user with hashed password
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Password strength validation
        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 12 characters long'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        // Check if user exists
        const existingUser = await usersCollection.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Hash password with bcrypt (10 rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = {
            username,
            email,
            passwordHash: hashedPassword,
            role: role || 'student',
            createdAt: new Date(),
            lastLogin: null,
            mfaEnabled: true,
        };

        const result = await usersCollection.insertOne(newUser);

        // Send welcome email
        await emailService.sendWelcomeEmail(email, username);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertedId,
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});

/**
 * LOGIN STEP 1 - Verify credentials (Single-Factor Authentication)
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        // Find user by username or email
        const user = await usersCollection.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate OTP for MFA
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in database with TTL
        const otpsCollection = db.collection('otps');
        await otpsCollection.insertOne({
            email: user.email,
            otp,
            createdAt: new Date(),
            expiresAt: otpExpiry,
        });

        // Send OTP via email
        const emailResult = await emailService.sendOTP(user.email, otp, user.username);

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            // Continue anyway for demo purposes, but log the error
        }

        res.json({
            success: true,
            message: 'Credentials verified. OTP sent to your email.',
            userId: user._id,
            email: user.email,
            requiresMFA: true,
            // For demo/test purposes, include preview URL if available
            ...(emailResult.previewUrl && { previewUrl: emailResult.previewUrl }),
            // In production, NEVER send OTP in response
            // But for testing without email, include it:
            ...(process.env.NODE_ENV === 'development' && { otp })
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});

/**
 * LOGIN STEP 2 - Verify OTP (Multi-Factor Authentication)
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Email and OTP are required'
            });
        }

        const db = getDB();
        const otpsCollection = db.collection('otps');
        const usersCollection = db.collection('users');

        // Find valid OTP
        const otpRecord = await otpsCollection.findOne({
            email,
            otp,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        // Delete used OTP
        await otpsCollection.deleteOne({ _id: otpRecord._id });

        // Get user
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update last login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        // Generate JWT token
        const token = generateToken(user);

        // Create session in database
        const sessionsCollection = db.collection('sessions');
        await sessionsCollection.insertOne({
            userId: user._id,
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        res.json({
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            error: 'OTP verification failed',
            message: error.message
        });
    }
});

/**
 * LOGOUT - Invalidate session
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (token) {
            const db = getDB();
            const sessionsCollection = db.collection('sessions');
            await sessionsCollection.deleteOne({ token });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            message: error.message
        });
    }
});

/**
 * VERIFY TOKEN - Check if token is valid
 * POST /api/auth/verify-token
 */
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token required'
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        // Check if session exists in database
        const db = getDB();
        const sessionsCollection = db.collection('sessions');
        const session = await sessionsCollection.findOne({
            token,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session'
            });
        }

        // Get user details
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: decoded.userId });

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: error.message
        });
    }
});

/**
 * CREATE ADMIN - Special endpoint to create admin users
 * POST /api/auth/create-admin
 * Requires ADMIN_SECRET_KEY in request body for security
 */
router.post('/create-admin', async (req, res) => {
    try {
        const { username, email, password, secretKey } = req.body;

        // Validation
        if (!username || !email || !password || !secretKey) {
            return res.status(400).json({
                success: false,
                error: 'All fields including secretKey are required'
            });
        }

        // Verify secret key (set this in your .env file)
        const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION';

        if (secretKey !== ADMIN_SECRET) {
            console.warn('⚠️  Unauthorized admin creation attempt:', { email, timestamp: new Date() });
            return res.status(403).json({
                success: false,
                error: 'Invalid secret key'
            });
        }

        // Password strength validation
        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 12 characters long'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        // Check if user exists
        const existingUser = await usersCollection.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Hash password with bcrypt (10 rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const newAdmin = {
            username,
            email,
            passwordHash: hashedPassword,
            role: 'admin',  // Force admin role
            createdAt: new Date(),
            lastLogin: null,
            mfaEnabled: true,
        };

        const result = await usersCollection.insertOne(newAdmin);

        // Send welcome email
        await emailService.sendWelcomeEmail(email, username);

        console.log('✅ Admin user created:', { username, email, id: result.insertedId });

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            userId: result.insertedId,
        });

    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Admin creation failed',
            message: error.message
        });
    }
});

module.exports = router;
