# 🎓 SecureEval: Cybersecurity Evaluation Platform

A production-grade, end-to-end secure system for submitting, evaluating, and publishing academic projects with military-grade encryption and institutional integrity.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Configure your `.env` file with MongoDB and SMTP credentials:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Run Application
```bash
npm run dev:all
```
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Security Demo**: http://localhost:8080/security-demo

---

## 🛡️ Security Architecture
This project implements a comprehensive 5-Part security suite:
- **Part 1**: Single & Multi-Factor Authentication (SFA + MFA)
- **Part 2**: Role-Based Access Control (RBAC) 
- **Part 3**: Hybrid Encryption (AES-256-GCM + RSA-2048)
- **Part 4**: Digital Signatures (RSA-PSS) & Hashing (SHA-256)
- **Part 5**: Secure Encoding & Theory

For a deep dive into the technical implementation, policies, and justifications, please refer to:
👉 **[Documentation.md](./Documentation.md)**

---

## 📂 Project Structure
- `src/`: React + TypeScript frontend.
- `server/`: Express + MongoDB backend.
- `Documentation.md`: Consolidate security reports and policies.

---
*Built using MongoDB, Express, React, TypeScript, and Web Crypto API.*
