
# Secure Project Submission and Evaluation System

A security-focused web application demonstrating authentication, authorization, encryption, hashing, and digital signatures. Designed for academic evaluation.

## Features

### 1. Authentication (NIST SP 800-63-2 Compliant Logic)
- **Identity Proofing Implies**: Simulates credential verification and MFA.
- **Secure Sessions**: Managed via Supabase Auth (or simulated Secure Context in Demo Mode).
- **Role-Based Login**: Student, Reviewer, Admin roles.

### 2. Authorization (RBAC)
- **Student**: Submit projects, View own results.
- **Reviewer**: View assigned projects, Decrypt submissions, Sign evaluations.
- **Admin**: Verify digital signatures, Audit system logs, Manage users.

### 3. Cryptography Implementation (Web Crypto API)
- **Encryption at Rest**:
  - Files are encrypted client-side using **AES-256-GCM**.
  - Reviewer's Public Key is used to wrap the AES Key using **RSA-OAEP**.
- **Integrity**:
  - SHA-256 Hashes of original files are stored and verified upon decryption.
- **Digital Signatures**:
  - Evaluation reports are signed by Reviewers using **RSA-PSS**.
  - Admins verify signatures using the Reviewer's Public Key.

## How to Demo

### Step 1: Student Submission
1. Login as valid student (e.g. `student@university.edu`) or use the Demo Login.
2. Go to **New Submission**.
3. Select a file.
4. Watch the "Security Progress":
   - Hashing (SHA-256)
   - Generating Ephemeral AES Key
   - Encrypting File
   - Wrapping Key (RSA) with Reviewer's Public Key
5. Submit.

### Step 2: Reviewer Evaluation
1. Login as reviewer (e.g. `reviewer@university.edu`).
2. Go to **Assigned Projects**.
3. Click **Decrypt & View**. The system will:
   - Unwrap the AES Key using Reviewer's Private Key.
   - Decrypt the file.
   - Verify the SHA-256 integrity hash.
4. Click **Evaluate**.
5. Enter Grade/Final Feedback.
6. **Sign & Submit**: The system signs the evaluation grade + feedback using the Reviewer's Private RSA Key.

### Step 3: Admin Verification
1. Login as admin (e.g. `admin@university.edu`).
2. Go to **Pending Approvals**.
3. Click **Verify & Publish**.
4. The system calculates the hash of the report and verifies the Digital Signature against the Reviewer's Public Key.
5. Check **Audit Logs** for the trace of actions.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS.
- **Crypto**: Native Web Crypto API (`window.crypto.subtle`).
- **Backend/Persistence**: Supabase (Auth) + Mock LocalStorage DB (for portable demonstration).
