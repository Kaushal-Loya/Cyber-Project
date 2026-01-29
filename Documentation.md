# 🛡️ SecureEval: Cybersecurity Implementation Master Report

## 📋 Executive Summary
SecureEval is a production-grade secure project evaluation system designed with a "Security by Design" philosophy. This document provides a comprehensive consolidation of the system's architecture, security policies, and technical implementations across all five parts of the development lifecycle.

---

## 🔐 Part 1: Authentication (SFA + MFA)
The system implements a robust multi-layered authentication mechanism to ensure identity assurance.

### Single-Factor Authentication (SFA)
- **Mechanism**: Username/Email and Password verification.
- **Hashing**: Passwords are never stored in plain text. We use **bcrypt** with 10 salt rounds on the backend and **PBKDF2** (100,000 iterations) for an additional layer of frontend security.
- **Persistence**: Secure session management using **JWT (JSON Web Tokens)** with a 24-hour expiration.

### Multi-Factor Authentication (MFA)
- **Factor 2**: 6-digit Time-based One-Time Password (OTP).
- **Delivery**: Real-time email delivery using **Nodemailer** via SMTP.
- **Security**: 5-minute expiration window with automatic cleanup in MongoDB via TTL (Time-To-Live) indexes.

---

## 🛡️ Part 2: Authorization (Role-Based Access Control)
Access is governed by a strict RBAC model, ensuring the **Principle of Least Privilege** and **Separation of Duties**.

### 📊 Access Control Matrix
| Role | Project Files | Evaluation Reports | Final Results |
| :--- | :--- | :--- | :--- |
| **STUDENT** | CREATE, READ (Own) | — | READ (Own) |
| **REVIEWER** | READ (Assigned) | CREATE, READ, SIGN | — |
| **ADMIN** | READ, DELETE | READ, VERIFY | FULL CONTROL |

### Key Security Policies
1. **Ownership Enforcement**: Students can only access resources tagged with their specific `userId`.
2. **Assignment Integrity**: Reviewers can only access project files explicitly assigned to them by an Admin.
3. **Chinese Wall Principle**: Reviewers author evaluations but cannot publish or modify final grades; Admins publish grades but cannot author evaluations.

---

## 🔒 Part 3: Encryption & Data Protection
We employ a hybrid encryption architecture combining symmetric and asymmetric cryptography for maximum performance and security.

### Cryptographic Suite
- **AES-256-GCM**: Used for encrypting the actual project content. GCM mode provides both confidentiality and built-in tamper detection (Authenticated Encryption).
- **RSA-OAEP (2048-bit)**: Used for secure key wrapping (transporting AES keys) and asymmetric encryption.
- **SHA-256**: Used for content hashing and generating unique "digital fingerprints" for every submission.

### Submission Workflow
1. **Hash**: Generate SHA-256 hash of the file.
2. **Encrypt**: Encrypt file using a unique, randomly generated AES-256 key.
3. **Wrap**: Wrap the AES key using the system's RSA public key.
4. **Store**: Persist the cipher text, IV, and wrapped key.

---

## 📜 Part 4: Hashing & Digital Signatures
Ensures transparency, non-repudiation, and auditability.

- **RSA-PSS (2048-bit)**: Used specifically for Digital Signatures.
- **Non-Repudiation**: Reviewers must cryptographically **SIGN** their evaluations using their private keys. This proves the evaluation came from them and has not been altered.
- **Admin Verification**: Every evaluation is **VERIFIED** by an Admin using the reviewer's public key before it is published to the student.

---

## 🔡 Part 5: Encoding & Theory
- **Base64 Encoding**: All binary cryptographic artifacts (keys, signatures, IVs) are Base64 encoded for safe transport and storage as strings.
- **Threat Mitigations**:
    - **Brute Force**: Mitigated by PBKDF2 iterations and rate limiting.
    - **Replay Attacks**: Mitigated by timestamped OTPs and session tokens.
    - **Tampering**: Prevented by SHA-256 integrity checks and AES-GCM tags.

---

## 🛠️ Administrative Setup & Usage

### 1. Initializing Admin Access
Due to security restrictions, Admin accounts cannot be created via the standard registration form. Use the following API endpoint once the server is running:

**Endpoint**: `POST /api/auth/create-admin`
**Payload**:
```json
{
  "username": "admin",
  "email": "admin@university.edu",
  "password": "StrongPassword123!",
  "secretKey": "SecureAdminKey2024" 
}
```

### 2. Workflow Orchestration
1. **Admin**: Verifies user registrations and assigns reviewers to projects.
2. **Reviewer**: Decrypts student files, evaluates work, and signs the report.
3. **Admin**: Verifies the signature and publishes the "Published & Verified" grade.
4. **Student**: Views the final grade and reviewer feedback in their "Grades" tab.

---

## 🧪 Testing Checklist
- [ ] **Auth**: Registration → MFA → Login (Verified)
- [ ] **RBAC**: Student attempts to view Reviewer dashboard (Denied)
- [ ] **Integrity**: Change 1 byte in an encrypted file → Decryption (Failed/Tamper Alert)
- [ ] **Non-Repudiation**: Verify signature on evaluation report (Success)
- [ ] **Cleanliness**: Ensure no plain-text passwords or keys exist in MongoDB.

---
*Built with Security as a Foundation — MongoDB, Express, React, TypeScript, and Web Crypto API.*
