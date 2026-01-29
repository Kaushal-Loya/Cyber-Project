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

### ⚖️ Policy Justifications ("The Who, What, and Why")

#### 1. STUDENT Role
- **Project Files (CREATE, READ)**: Students must upload their own work and review what they submitted. **Restriction**: They cannot UPDATE or DELETE after submission to ensure academic integrity and prevent tampering with evidence once the deadline passes.
- **Evaluation Reports (NO ACCESS)**: Students are restricted from seeing internal reviewer notes to prevent bias and maintain the confidentiality of the academic assessment process.
- **Final Results (READ)**: Students have a fundamental right to see their own verified grades but no authority to influence the data.

#### 2. REVIEWER Role
- **Project Files (READ)**: Required to perform the assessment. **Restriction**: They cannot CREATE or MODIFY student files to prevent any unauthorized changes to the original work.
- **Evaluation Reports (CREATE, READ, SIGN)**: Reviewers are the authors of assessments. The **SIGN** action is critical for **Non-Repudiation**—it legally binds the reviewer to their assessment.
- **Final Results (NO ACCESS)**: Implements **Separation of Duties**; the person giving the raw feedback shouldn't be the one officially publishing final institution-verified grades.

#### 3. ADMIN Role
- **Project Files (READ, DELETE)**: Admins require oversight to manage the system and delete inappropriate or malicious content with a full audit log.
- **Evaluation Reports (READ, VERIFY)**: Admins audit the quality of reviews and use the **VERIFY** action to cryptographically confirm that a reviewer's signature is valid before moving to publication.
- **Final Results (FULL CONTROL)**: As the highest authority (Office of Controller), they have full CRUD permissions to manage the definitive institutional record of results.

### 🛡️ Implementation of Access Control
Permissions are not just hidden in the UI; they are enforced **programmatically** on the backend:
1. **Middleware Enforcement**: The `checkPermission` middleware in `server/middleware/accessControl.js` validates every API request against the user's JWT role.
2. **Ownership Checks**: Database queries (e.g., `projects.find({ studentId: userId })`) ensure users can only interact with their own data regardless of role.
3. **Immutability logic**: Code-level checks prevent even an Admin from "editing" a signed evaluation report once it has been verified.

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
