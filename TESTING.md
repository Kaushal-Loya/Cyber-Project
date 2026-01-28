
# Secure Project Submission System - Testing Guide

This document outlines the step-by-step process to validate the security features of the application. The system is designed to demonstrate a complete secure workflow involving encryption, digital signatures, and role-based access control.

## Prerequisites

1.  Ensure the application is running:
    ```bash
    npm run dev
    ```
2.  Open your browser to `http://localhost:8080` (or the port shown in your terminal).

---

## 🔐 Credentials & Roles

 The system uses **Logic-Based Authentication** for the demo. The role is determined by the email address you enter. The password can be anything (e.g., `password123`) as we are simulating the authentication step.

| Role | Email Pattern / Example | Capabilities |
| :--- | :--- | :--- |
| **Student** | Any email *without* keywords below.<br>Example: `student@demo.edu` | • Secure File Upload (AES-256) <br> • View Own Grades |
| **Reviewer** | Contains `reviewer`, `roberts`, or `williams`.<br>Example: `reviewer@demo.edu` | • Decrypt Submissions (RSA-Unwrap) <br> • Sign Evaluations (RSA-PSS) |
| **Admin** | Contains `admin`.<br>Example: `admin@demo.edu` | • Verify Signatures <br> • Publish Results <br> • View Audit Logs |

---

## 🧪 Test Scenarios

Follow these scenarios in order to test the full lifecycle of a project submission.

### Scenario 1: Student Submission (Encryption & Integrity)

**Objective**: Verify that files are encrypted client-side and keys are securely wrapped before storage.

1.  **Login**:
    *   Navigate to Login.
    *   Email: `student@demo.edu`
    *   Password: `password`
    *   OTP: `123456`
2.  **Action**:
    *   Click **New Submission**.
    *   Enter a Title (e.g., "Cybersecurity Final").
    *   Select any file from your computer (e.g., a text file or PDF).
    *   Click **Secure Submit**.
3.  **Observation**:
    *   Watch the modal progress steps: `Hashing` -> `AES Encrypting` -> `RSA Key Wrapping` -> `Uploading`.
    *   *Technical Check*: Inspect the LocalStorage in Developer Tools (`Application` tab -> `Local Storage`). Look for `demo_submissions`. You will see `encryptedData` (ciphertext) instead of your raw file content.
4.  **Logout**: Click "Sign Out".

### Scenario 2: Reviewer Evaluation (Decryption & Signing)

**Objective**: Verify that the reviewer can decrypt the file using their private key and digitally sign their evaluation.

1.  **Login**:
    *   Email: `reviewer@demo.edu`
    *   OTP: `123456`
2.  **Action**:
    *   You should see the "Cybersecurity Final" project in "Assigned Projects".
    *   Click **Decrypt & View**. 
    *   *Verification*: The system prompts "Integrity Verified" if the hash matches. The file should download.
    *   Click **Evaluate**.
    *   Select a Grade (e.g., "A") and enter Feedback.
    *   Click **Sign & Submit Evaluation**.
3.  **Observation**:
    *   The system generates a digital signature of your grade and feedback.
    *   The status changes to "Signed".
4.  **Logout**: Click "Sign Out".

### Scenario 3: Admin Verification (Non-Repudiation)

**Objective**: Verify that the admin can cryptographically prove the evaluation came from the specific reviewer and hasn't been tampered with.

1.  **Login**:
    *   Email: `admin@demo.edu`
    *   OTP: `123456`
2.  **Action**:
    *   Go to **Pending Approvals**.
    *   Find the project evaluated in Scenario 2.
    *   Note the Status: "Awaiting Verification".
    *   Click **Verify & Publish**.
3.  **Observation**:
    *   The system retrieves the Reviewer's Public Key.
    *   It verifies the `RSA-PSS` signature.
    *   A success toast "Signature Verified!" appears.
    *   The status changes to "Verified" or "Published".
4.  **Audit Check**:
    *   Click the **Audit Logs** tab.
    *   Verify a new entry exists for `RESULT_PUBLISH`.

---

## 🛡️ Technical Validation (Deep Dive)

If you want to verify the cryptography is real (not just UI animation):

1.  **Open Developer Tools (F12)**.
2.  **Go to Console**.
3.  Run `localStorage.getItem('public_key_directory')`.
    *   You will see the Public Keys (RSA) generated for the users you logged in as.
4.  **Check Submissions**:
    *   Run `JSON.parse(localStorage.getItem('demo_submissions'))`.
    *   Expand the object. Notice `encryptedKey` (RSA wrapped AES key) and `encryptedData` (AES-GCM ciphertext).
5.  **Check Evaluations**:
    *   Run `JSON.parse(localStorage.getItem('demo_evaluations'))`.
    *   Notice the `signature` field (Base64 encoded RSA signature).

## troubleshooting

*   **"Integrity Check Failed"**: This happens if you modify the submission entry in LocalStorage manually.
*   **"Decryption Failed"**: Ensure you are logged in as the specific reviewer intended (or `reviewer@demo.edu` if using the demo flow). Since keys are stored in `localStorage`, using a different browser or Incognito window will reset your keys. **Keep all testing in the same browser session.**
