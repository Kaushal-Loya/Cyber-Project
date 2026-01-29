const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const emailService = require('../services/emailService');
const { authenticate } = require('../middleware/accessControl');

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
            encPub: null,  // RSA-OAEP public key for encryption
            signPub: null, // RSA-PSS public key for signing
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

        // CHECK FOR MFA TRUST TOKEN (Remember Me)
        const { mfaToken } = req.body;
        if (mfaToken && user.mfaTrustToken === mfaToken && user.mfaTrustExpires > new Date()) {
            console.log(`✅ Skipping MFA for user ${user.email} (Remember Me active)`);

            // Generate full access token immediately
            const token = generateToken(user);

            // Create session
            const sessionsCollection = db.collection('sessions');
            await sessionsCollection.insertOne({
                userId: user._id,
                token,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            return res.json({
                success: true,
                message: 'Login successful (MFA skipped)',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                requiresMFA: false
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

        // HANDLE REMEMBER ME (Issue trust token)
        const { rememberMe } = req.body;
        let issuedMfaToken = null;
        if (rememberMe) {
            issuedMfaToken = crypto.randomBytes(32).toString('hex');
            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        mfaTrustToken: issuedMfaToken,
                        mfaTrustExpires: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                    }
                }
            );
        }

        res.json({
            success: true,
            message: 'OTP verified successfully',
            token,
            mfaToken: issuedMfaToken,
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

/**
 * UPDATE PUBLIC KEYS - Store user's public keys
 * POST /api/auth/update-keys
 */
router.post('/update-keys', async (req, res) => {
    try {
        const { token, encPub, signPub } = req.body;

        if (!token || !encPub || !signPub) {
            return res.status(400).json({
                success: false,
                error: 'Token and public keys are required'
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        const db = getDB();
        const usersCollection = db.collection('users');

        // Update user's public keys
        await usersCollection.updateOne(
            { _id: new ObjectId(decoded.userId) },
            {
                $set: {
                    encPub,
                    signPub,
                    keysUpdatedAt: new Date()
                }
            }
        );

        console.log('✅ Public keys updated:', {
            userId: decoded.userId,
            email: decoded.email
        });

        res.json({
            success: true,
            message: 'Public keys updated successfully'
        });

    } catch (error) {
        console.error('Update keys error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update keys',
            message: error.message
        });
    }
});

/**
 * GET REVIEWER PUBLIC KEYS - Get all reviewer public keys for encryption
 * GET /api/auth/reviewer-keys
 */
router.get('/reviewer-keys', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');

        // Get all reviewers with public keys
        const reviewers = await usersCollection.find({
            role: 'reviewer',
            encPub: { $ne: null }
        }).project({
            _id: 1,
            email: 1,
            username: 1,
            encPub: 1,
            signPub: 1
        }).toArray();

        res.json({
            success: true,
            reviewers: reviewers.map(r => ({
                id: r._id,
                email: r.email,
                username: r.username,
                encPub: r.encPub,
                signPub: r.signPub
            }))
        });

    } catch (error) {
        console.error('Get reviewer keys error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviewer keys',
            message: error.message
        });
    }
});

/**
 * GET ALL USERS - Admin only
 * GET /api/auth/users
 */
router.get('/users', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - Admin only'
            });
        }

        const db = getDB();
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({})
            .project({
                passwordHash: 0, // Never send hashes
                mfaSecret: 0,
                mfaTrustToken: 0
            })
            .toArray();

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

module.exports = router;
