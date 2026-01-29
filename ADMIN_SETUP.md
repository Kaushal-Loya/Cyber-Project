# How to Create an Admin Account

## Method 1: Using the Admin Creation API (Recommended)

### Step 1: Make sure server is running
```bash
npm run dev:all
```

### Step 2: Create admin using API

**Using PowerShell:**
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    username = "admin"
    email = "admin@secureeval.com"
    password = "Admin@SecureEval2024!"
    secretKey = "SecureAdmin2024!ChangeThis"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/create-admin" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@secureeval.com",
    "password": "Admin@SecureEval2024!",
    "secretKey": "SecureAdmin2024!ChangeThis"
  }'
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:5000/api/auth/create-admin`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "username": "admin",
  "email": "admin@secureeval.com",
  "password": "Admin@SecureEval2024!",
  "secretKey": "SecureAdmin2024!ChangeThis"
}
```

### Step 3: Login as Admin
1. Go to: http://localhost:8080/login
2. Enter your admin credentials
3. Complete MFA with OTP sent to email

---

## Method 2: Direct Database Modification

### If you already have a user account:

1. **Login to MongoDB Atlas**
   - Go to: https://cloud.mongodb.com/
   - Click "Browse Collections"

2. **Find your user**
   - Database: `secureeval`
   - Collection: `users`
   - Find your user document

3. **Edit the role field**
   - Click "Edit Document"
   - Change `"role": "student"` to `"role": "admin"`
   - Click "Update"

4. **Logout and login again** for changes to take effect

---

## Admin Features & Permissions

Based on the RBAC Policy (see `RBAC_POLICY.md`), admins have:

### 1. **Project Files**
- ✅ **READ** - View all student project submissions
- ✅ **DELETE** - Remove inappropriate or policy-violating content
- ❌ CREATE/UPDATE - Cannot create or modify projects (maintains integrity)

**Use Cases:**
- Content moderation
- Compliance review
- Incident investigation
- System audits

### 2. **Evaluation Reports**
- ✅ **READ** - View all reviewer evaluations
- ✅ **VERIFY** - Validate digital signatures on reports
- ❌ CREATE/UPDATE/DELETE - Cannot modify evaluations (separation of duties)

**Use Cases:**
- Audit reviewer assessments
- Verify report authenticity
- Investigate disputes
- Quality assurance

### 3. **Final Results**
- ✅ **CREATE** - Generate final grades from evaluations
- ✅ **READ** - View all student results
- ✅ **UPDATE** - Modify results (for appeals, corrections)
- ✅ **DELETE** - Remove erroneous results

**Use Cases:**
- Compile final grades
- Process appeals
- Correct errors
- Manage academic records

### 4. **System Management**
- Access control administration
- User management
- System configuration
- Audit log review
- Security monitoring

---

## Admin Dashboard Features

Once logged in as admin, you get access to:

1. **Admin Dashboard** (`/admin-dashboard`)
   - System overview
   - User management
   - Audit logs
   - Security alerts

2. **All Project Files**
   - View submitted projects
   - Delete policy violations
   - Monitor submissions

3. **Verification Tools**
   - Verify evaluation signatures
   - Validate report integrity
   - Detect tampering

4. **Results Management**
   - Create final results
   - Update grades
   - Process appeals
   - Export reports

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Change the Admin Secret Key** in `.env` for production:
   ```env
   ADMIN_SECRET_KEY=your-own-very-secure-secret-key-here
   ```

2. **Limit Admin Accounts:**
   - Only create admin accounts for trusted staff
   - Use strong passwords (12+ characters, mixed case, numbers, special chars)
   - Enable MFA (already enabled by default)

3. **Monitor Admin Actions:**
   - All admin actions are logged
   - Review audit logs regularly
   - Investigate suspicious activity

4. **Principle of Least Privilege:**
   - Use student/reviewer accounts for regular tasks
   - Only use admin for administrative functions
   - Never share admin credentials

---

## Testing Admin Permissions

Visit: **http://localhost:8080/security-demo**

1. Click **"Access Control"** tab
2. See the complete RBAC matrix
3. Admin row shows all permissions

---

## Troubleshooting

### "Invalid secret key" error
- Check `.env` file has `ADMIN_SECRET_KEY` defined
- Make sure you're using the exact same key in your API request
- Restart the server after changing `.env`

### "Email already registered"
- User already exists in database
- Use Method 2 to change existing user to admin
- Or use a different email address

### Admin dashboard not accessible
- Make sure you logged in as admin role
- Check browser console for errors
- Verify token in localStorage contains `"role": "admin"`

---

**Next Steps:**
1. Create your admin account
2. Login with admin credentials
3. Explore admin dashboard
4. Test RBAC permissions on Security Demo page
