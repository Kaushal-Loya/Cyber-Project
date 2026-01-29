# Cybersecurity Project - Complete Implementation Guide

This project implements a complete cybersecurity system with **real MongoDB database** and **email-based MFA** using nodemailer.

## 🚀 Features Implemented

### ✅ **Part 1: Authentication**
- **Single-Factor Authentication (SFA):**
  - Username/Password login
  - **bcrypt password hashing** (10 rounds)
  - MongoDB storage
  
- **Multi-Factor Authentication (MFA):**
  - Password + OTP via **email** (nodemailer with SMTP)
  - 6-digit OTP with 5-minute expiration
  - Real email delivery (Gmail, Ethereal for testing)

### ✅ **Part 2: Access Control (RBAC)**
- Role-Based Access Control Matrix
- 3 Subjects: Student, Reviewer, Admin
- 3 Objects: Project Files, Evaluation Reports, Final Results
- Programmatic permission enforcement

### ✅ **Part 3: Encryption**
- AES-256-GCM symmetric encryption
- RSA-2048 key exchange
- Hybrid encryption approach

### ✅ **Part 4: Hashing & Digital Signatures**
- **bcrypt** for password hashing (backend)
- **PBKDF2** for additional frontend security
- RSA-PSS digital signatures
- SHA-256 hashing

### ✅ **Part 5: Encoding**
- Base64 encoding/decoding
- Used for key transport and data serialization

---

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (Local or Atlas Cloud)
3. **Email SMTP** (Gmail or Ethereal for testing)

---

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB:
   ```bash
   mongod
   ```
3. Keep default URI in `.env`: `mongodb://localhost:27017/secureeval`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secureeval
   ```

### Step 3: Email Configuration

#### Option A: Gmail (Production)
1. Enable 2FA in your Google Account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   ```

#### Option B: Ethereal (Testing - Automatic)
- Leave SMTP credentials empty
- System will create test account automatically
- Check console for preview URLs

### Step 4: Update Environment Variables

Edit `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/secureeval

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Email (Gmail or leave empty for Ethereal)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API  
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Application

### Option 1: Run Both Frontend & Backend Together (Recommended)

```bash
npm run dev:all
```

This starts:
- **Frontend (Vite):** http://localhost:5173
- **Backend (Express):** http://localhost:5000

### Option 2: Run Separately

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

---

## 🧪 Testing the System

### 1. **Register a New User**

1. Navigate to http://localhost:5173/register
2. Fill in details:
   - Username: `test_student`
   - Email: `test@example.com` (use real email if using Gmail)
   - Password: `SecurePass123!@#` (meets all requirements)
   - Role: Student or Reviewer
3. Click "Create Secure Account"
4. **Check your email** for welcome message!

### 2. **Login with MFA**

1. Navigate to http://localhost:5173/login
2. Enter username and password
3. Backend verifies with **bcrypt**
4. **OTP sent to your email**
5. Check email (or console for test OTP)
6. Enter 6-digit OTP
7. Successfully logged in!

### 3. **Test Email Delivery**

#### Using Gmail:
- Real emails will be delivered to inbox
- Check spam folder if not received

#### Using Ethereal (Test):
- Check backend console output
- Look for: `📧 Preview email: https://ethereal.email/message/...`
- Open URL to see email

### 4. **Security Demo**

Visit http://localhost:5173/security-demo

Test all features:
- Password hashing with salt
- Access control matrix
- AES encryption/decryption
- Digital signatures
- Base64 encoding

---

## 📊 Database Structure

### Collections

#### `users`
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  passwordHash: String (bcrypt),
  role: String (student|reviewer|admin),
  createdAt: Date,
  lastLogin: Date,
  mfaEnabled: Boolean
}
```

#### `otps` (TTL: 10 minutes)
```javascript
{
  _id: ObjectId,
  email: String,
  otp: String (6-digit),
  createdAt: Date (indexed with TTL),
  expiresAt: Date
}
```

#### `sessions` (TTL: 24 hours)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  token: String (JWT),
  createdAt: Date (indexed with TTL),
  expiresAt: Date
}
```

---

## 🔐 Security Implementation Details

### Password Security
- **Backend:** bcrypt with 10 salt rounds
- **Frontend:** PBKDF2 with 100,000 iterations (additional layer)
- Passwords stored as hashes, never plain text

### MFA Implementation
- **Step 1:** Password authentication (SFA)
- **Step 2:** OTP via email (real SMTP delivery)
- OTP: 6 digits, 5-minute expiration
- Stored in MongoDB with TTL index (auto-deletion)

### Session Management
- JWT tokens with 24-hour expiry
- Sessions stored in MongoDB with TTL
- Token verification on each protected request

### Email Security
- TLS encryption for SMTP
- OAuth2 support (Gmail App Passwords)
- HTML + Plain text emails
- Professional templates with security warnings

---

## 🌐 API Endpoints

### Authentication

#### POST `/api/auth/register`
```json
// Request
{
  "username": "student1",
  "email": "student@example.com",
  "password": "SecurePass123!",
  "role": "student"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "userId": "..."
}
```

#### POST `/api/auth/login` (Step 1)
```json
// Request
{
  "username": "student1",
  "password": "SecurePass123!"
}

// Response
{
  "success": true,
  "message": "Credentials verified. OTP sent to your email.",
  "email": "student@example.com",
  "requiresMFA": true,
  "otp": "123456" (development only)
}
```

#### POST `/api/auth/verify-otp` (Step 2)
```json
// Request
{
  "email": "student@example.com",
  "otp": "123456"
}

// Response
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "username": "student1",
    "email": "student@example.com",
    "role": "student"
  }
}
```

#### GET `/api/health`
```json
{
  "status": "OK",
  "message": "SecureEval API Server Running",
  "timestamp": "2024-01-29T..."
}
```

---

## 🎯 Demo Users

You can create test users through registration or use MongoDB Compass/Shell:

```javascript
// MongoDB Shell
use secureeval

db.users.insertOne({
  username: "admin1",
  email: "admin@example.com",
  passwordHash: "$2a$10$<bcrypt-hash>",  // Use registration to create
  role: "admin",
  createdAt: new Date(),
  mfaEnabled: true
})
```

---

## 📝 Testing Checklist

- [ ] MongoDB connection successful
- [ ] User registration works
- [ ] Password hashing (bcrypt) verified
- [ ] Email delivery (welcome email received)
- [ ] Login Step 1 (password verification)
- [ ] OTP email received
- [ ] Login Step 2 (OTP verification)
- [ ] JWT token generated
- [ ] Session created in database
- [ ] Role-based dashboard access
- [ ] Logout clears session
- [ ] Security Demo page functional

---

## 🔧 Troubleshooting

### MongoDB Connection Issues
```
Error: MongoServerError: Authentication failed
```
**Solution:** Check MongoDB URI, username, password in `.env`

### Email Not Sending
```
Error: SMTP authentication failed
```
**Solutions:**
1. **Gmail:** Enable 2FA and create App Password
2. **Ethereal:** Leave credentials empty (auto-creates test account)
3. Check SMTP settings in `.env`

### CORS Errors
```
Access to fetch at 'http://localhost:5000' blocked
```
**Solution:** Ensure backend is running on port 5000

### OTP Expired
```
Error: Invalid or expired OTP
```
**Solution:** OTPs expire after 5 minutes. Request new login.

---

## 📚 Documentation

- **Full Implementation:** See `SECURITY_IMPLEMENTATION.md`
- **API Routes:** `server/routes/auth.js`
- **Email Service:** `server/services/emailService.js`
- **Frontend API:** `src/services/ApiService.ts`

---

## 🎓 Technologies Used

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Auth:** bcrypt + JWT
- **Email:** nodemailer
- **Crypto:** Web Crypto API, bcryptjs
- **UI:** shadcn/ui + Tailwind CSS

---

## 📧 Support

For issues:
1. Check MongoDB is running
2. Verify `.env` configuration
3. Check browser console for errors
4. Check backend terminal for logs

---

## 🎉 Success!

If everything works:
- ✅ You can register users
- ✅ Receive emails (welcome + OTP)
- ✅ Login with MFA
- ✅ Access role-based dashboards
- ✅ All security features functional

**Congratulations! Your complete cybersecurity system is running!** 🎊
