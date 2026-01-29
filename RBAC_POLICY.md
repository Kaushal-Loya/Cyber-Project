# Access Control Policy Documentation

## Role-Based Access Control (RBAC) Matrix

### Overview
This document defines the access control policies for the SecureEval system, implementing a Role-Based Access Control (RBAC) model with the **Principle of Least Privilege**.

---

## Subjects (Roles)

### 1. **STUDENT**
- **Description:** Academic users submitting projects for evaluation
- **Security Clearance:** Basic
- **Trust Level:** Low (untrusted content creators)

### 2. **REVIEWER**
- **Description:** Evaluators responsible for assessing student projects
- **Security Clearance:** Elevated
- **Trust Level:** Medium (trusted evaluators)

### 3. **ADMIN**
- **Description:** System administrators managing the platform
- **Security Clearance:** Highest
- **Trust Level:** High (full system access)

---

## Objects (Resources)

### 1. **PROJECT_FILE**
- **Description:** Student-submitted project files and documentation
- **Sensitivity:** Medium (may contain proprietary student work)
- **Integrity Requirement:** High (must prevent tampering)

### 2. **EVALUATION_REPORT**
- **Description:** Reviewer-generated assessment reports
- **Sensitivity:** High (affects student grades)
- **Integrity Requirement:** Critical (requires digital signatures)

### 3. **FINAL_RESULT**
- **Description:** Final grades and evaluation outcomes
- **Sensitivity:** Critical (permanent academic records)
- **Integrity Requirement:** Critical (requires verification and audit trail)

---

## Actions

| Action   | Description                                      |
|----------|--------------------------------------------------|
| CREATE   | Create new resource instances                    |
| READ     | View existing resource content                   |
| UPDATE   | Modify existing resource content                 |
| DELETE   | Remove resources from the system                 |
| SIGN     | Apply digital signature for integrity           |
| VERIFY   | Validate digital signatures and authenticity     |

---

## Complete Access Control Matrix

| **Subject → Object** | **PROJECT_FILE** | **EVALUATION_REPORT** | **FINAL_RESULT** |
|----------------------|------------------|-----------------------|------------------|
| **STUDENT**          | CREATE, READ     | —                     | READ             |
| **REVIEWER**         | READ             | CREATE, READ, SIGN    | —                |
| **ADMIN**            | READ, DELETE     | READ, VERIFY          | CREATE, UPDATE, READ, DELETE |

---

## Detailed Policy Justifications

### STUDENT Role

#### PROJECT_FILE: CREATE, READ
**Justification:**
- **CREATE:** Students must submit their own project files
- **READ:** Students need to review their submitted files
- **NO UPDATE:** Prevents tampering after submission (academic integrity)
- **NO DELETE:** Only admins can remove files (prevents accidental loss)
- **Scope Restriction:** Students can ONLY access their OWN files (ownership enforcement)

**Security Rationale:**
- Follows principle of least privilege
- Prevents students from viewing others' work (academic honesty)
- Prevents post-submission modifications (maintains evaluation fairness)

#### FINAL_RESULT: READ
**Justification:**
- **READ:** Students have right to view their own grades
- **NO CREATE/UPDATE/DELETE:** Only admins manage final results
- **Scope Restriction:** Students can ONLY view their OWN results

**Security Rationale:**
- Transparency in grading
- Prevents grade manipulation
- Audit trail maintained by admin actions

#### EVALUATION_REPORT: No Access
**Justification:**
- **NO ACCESS:** Raw evaluation reports contain reviewer notes and internal assessments
- Students receive processed results, not raw evaluations
- Prevents bias and maintains evaluation integrity

---

### REVIEWER Role

#### PROJECT_FILE: READ
**Justification:**
- **READ:** Required to evaluate student submissions
- **NO CREATE:** Reviewers don't submit projects
- **NO UPDATE/DELETE:** Prevents evidence tampering
- **Scope Restriction:** Reviewers can ONLY read files assigned to them

**Security Rationale:**
- Read-only access maintains evidence integrity
- Assignment-based access prevents unauthorized viewing
- Audit trail tracks all file access

#### EVALUATION_REPORT: CREATE, READ, SIGN
**Justification:**
- **CREATE:** Reviewers author evaluation reports
- **READ:** Need to review their own assessments
- **SIGN:** Digital signatures ensure non-repudiation and authenticity
- **NO UPDATE:** Once signed, reports are immutable (use versioning if changes needed)
- **NO DELETE:** Maintains complete evaluation history

**Security Rationale:**
- Digital signatures prevent report tampering
- Immutability ensures evaluation integrity
- Non-repudiation holds reviewers accountable

#### FINAL_RESULT: No Access
**Justification:**
- **NO ACCESS:** Reviewers don't publish final results
- Admin aggregates multiple evaluations into final results
- Separation of duties (Chinese Wall policy)

---

### ADMIN Role

#### PROJECT_FILE: READ, DELETE
**Justification:**
- **READ:** System oversight and audit capabilities
- **DELETE:** Remove inappropriate, malicious, or policy-violating content
- **NO CREATE:** Admins don't submit projects
- **NO UPDATE:** Maintains file integrity (deletion with audit trail preferred)

**Security Rationale:**
- Oversight capability for system integrity
- Deletion requires justification and is logged
- Read-all access enables incident response

#### EVALUATION_REPORT: READ, VERIFY
**Justification:**
- **READ:** Audit and oversight of evaluation process
- **VERIFY:** Validate digital signatures for integrity
- **NO CREATE:** Admins don't write evaluations (separation of duties)
- **NO UPDATE/DELETE:** Maintains evaluation integrity

**Security Rationale:**
- Signature verification ensures report authenticity
- Prevents admin manipulation of evaluations
- Audit capability without compromise authority

#### FINAL_RESULT: CREATE, UPDATE, READ, DELETE (Full Control)
**Justification:**
- **CREATE:** Admins compile and publish final results
- **READ:** Full visibility for oversight
- **UPDATE:** Corrections and appeals processing
- **DELETE:** Remove erroneous or contested results
- **SIGN (implicit):** All result changes are digitally signed

**Security Rationale:**
- Complete control needed for grade management
- All actions logged for accountability
- Appeals process requires update capability
- Full audit trail maintains transparency

---

## Additional Security Controls

### 1. **Ownership Enforcement**
- Resources tagged with owner IDs
- ACL checks include ownership verification
- Example: Student can READ only PROJECT_FILES where `ownerId === userId`

### 2. **Assignment-Based Access**
- Reviewers can READ only PROJECT_FILES assigned to them
- Assignment records maintained in database
- Example: `WHERE assignedReviewerId === userId`

### 3. **Temporal Controls**
- Access may be time-bound (e.g., submission deadlines)
- After deadline, students lose CREATE permission

### 4. **Audit Logging**
- All access attempts logged (success and failure)
- Log includes: timestamp, userId, action, resource, result
- Tamper-proof logging for compliance

### 5. **Separation of Duties**
- Reviewers cannot see final results
- Students cannot see raw evaluation reports
- Prevents conflicts of interest

---

## Implementation Notes

### Backend Enforcement
- Access control enforced at API layer (not just UI)
- Middleware validates permissions before processing requests
- Database queries filtered by user permissions

### Frontend UI
- UI elements hidden based on permissions (user experience)
- Backend still validates (security)
- Graceful error messages for unauthorized access

### Error Handling
- HTTP 403 Forbidden for denied access
- HTTP 404 Not Found for resource not owned (prevents information disclosure)
- Generic error messages to prevent enumeration attacks

---

## Compliance & Standards

This RBAC implementation follows:
- ✅ **NIST SP 800-162:** Attribute Based Access Control (ABAC) compatible
- ✅ **ISO 27001:** Information Security Management
- ✅ **Principle of Least Privilege:** Minimal necessary permissions
- ✅ **Separation of Duties:** No single role has excessive control
- ✅ **Need-to-Know Basis:** Access restricted to job requirements

---

## Testing & Verification

### Test Cases
1. Student attempts to READ another student's PROJECT_FILE → DENIED
2. Student attempts to DELETE own PROJECT_FILE → DENIED
3. Reviewer attempts to UPDATE EVALUATION_REPORT after SIGN → DENIED
4. Admin attempts to CREATE EVALUATION_REPORT → DENIED (separation of duties)
5. Reviewer attempts to READ unassigned PROJECT_FILE → DENIED

### Audit Requirements
- Monthly access log reviews
- Quarterly permission audits
- Annual policy reviews

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-29  
**Owner:** SecureEval Security Team  
**Classification:** Internal Use Only
