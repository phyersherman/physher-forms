# Phase 9: Learner Experience Enhancement - Detailed Plan

**Created:** February 20, 2026  
**Updated:** February 20, 2026  
**Goal:** Enhance the learner experience with dashboard, certificates, bulk user management, and flexible enrollment options

## Overview

Phase 9 focuses on five key features:
1. **Learner Dashboard** - Central hub showing enrolled courses and progress
2. **Certificate Generation** - PDF certificates awarded on course completion
3. **Registration Links** - Admin-created links for automatic signup and course enrollment
4. **Bulk User Management** - Import/create multiple users and bulk course assignments
5. **Passwordless Course Access** - Email-based authentication with magic codes for simplified access

---

## Feature 1: Learner Dashboard

### 1.1 Database Schema Changes

**New Table: `Enrollment`**
```prisma
model Enrollment {
  id              String   @id @default(cuid())
  userId          String
  courseId        String
  tenantId        String
  enrolledAt      DateTime @default(now())
  completedAt     DateTime?
  certificateId   String?
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  certificate     Certificate? @relation(fields: [certificateId], references: [id])
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
  @@index([tenantId])
}
```

**Migration Tasks:**
- [ ] Create migration: `add_enrollment_table`
- [ ] Add `Enrollment` relation to `User` model
- [ ] Add `Enrollment` relation to `Course` model
- [ ] Seed existing course access as enrollments (migration script)

### 1.2 Backend API Endpoints

**Enrollment Service** (`backend/src/services/enrollmentService.ts`)
- `enrollUser(userId: string, courseId: string, tenantId: string)` - Enroll user in course
- `getUserEnrollments(userId: string, tenantId: string)` - Get all enrollments for user
- `getEnrollmentProgress(enrollmentId: string)` - Calculate completion percentage
- `markCourseComplete(enrollmentId: string)` - Mark course as completed
- `unenrollUser(userId: string, courseId: string)` - Remove enrollment

**Enrollment Controller** (`backend/src/controllers/enrollmentController.ts`)
- `POST /api/enrollments` - Admin enrolls user in course
- `GET /api/enrollments/me` - Get current user's enrollments with progress
- `GET /api/enrollments/:enrollmentId/progress` - Get detailed progress for enrollment
- `DELETE /api/enrollments/:enrollmentId` - Unenroll user (admin only)

**Progress Calculation Logic:**
```typescript
interface CourseProgress {
  totalModules: number
  completedModules: number
  percentComplete: number
  requiredModulesComplete: number
  requiredModulesTotal: number
  canReceiveCertificate: boolean
}

// Calculate based on ModuleCompletion records
// Required modules must all be completed for certificate eligibility
```

### 1.3 Frontend Components

**Page: `/dashboard`** (Learner dashboard)
- Display enrolled courses as cards
- Show progress bar for each course
- Display enrollment date
- Link to course viewer
- Badge if course completed
- Certificate download button if available

**Component Structure:**
```tsx
<DashboardLayout>
  <DashboardHeader user={user} />
  <EnrolledCoursesList>
    {enrollments.map(enrollment => (
      <CourseCard
        course={enrollment.course}
        progress={enrollment.progress}
        completedAt={enrollment.completedAt}
        certificateId={enrollment.certificateId}
      />
    ))}
  </EnrolledCoursesList>
  <EmptyState /> // If no enrollments
</DashboardLayout>
```

**Tasks:**
- [ ] Create `DashboardLayout.tsx` (simple header + content, reuse existing components)
- [ ] Create `CourseCard.tsx` with progress indicators
- [ ] Create `pages/dashboard.tsx`
- [ ] Add progress calculation to enrollment API response
- [ ] Style with existing CSS patterns (reuse admin-table.module.css structure)

---

## Feature 2: Certificate Generation

### 2.1 Database Schema Changes

**New Table: `Certificate`**
```prisma
model Certificate {
  id              String   @id @default(cuid())
  enrollmentId    String   @unique
  userId          String
  courseId        String
  tenantId        String
  issuedAt        DateTime @default(now())
  certificateNumber String  @unique  // e.g., "CERT-2026-001234"
  pdfUrl          String?             // S3/local path to PDF
  
  enrollment      Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([courseId])
}
```

**Certificate Template Configuration (per Tenant):**
```prisma
model CertificateTemplate {
  id              String   @id @default(cuid())
  tenantId        String?  // null = global default
  templateName    String   @default("default")
  backgroundColor String   @default("#ffffff")
  borderColor     String   @default("#000000")
  textColor       String   @default("#000000")
  logoUrl         String?
  signatureUrl    String?
  footerText      String?
  
  tenant          Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, templateName])
}
```

**Migration Tasks:**
- [ ] Create migration: `add_certificates_and_templates`
- [ ] Add `Certificate` relation to `User`, `Course`, `Enrollment`
- [ ] Add `CertificateTemplate` relation to `Tenant`

### 2.2 PDF Generation

**Technology Stack:**
- Library: `pdfkit` or `puppeteer` (HTML to PDF)
- Storage: Local filesystem initially (can move to S3 later)
- Directory: `backend/uploads/certificates/`

**Certificate Service** (`backend/src/services/certificateService.ts`)
```typescript
interface CertificateData {
  recipientName: string
  courseName: string
  completionDate: Date
  certificateNumber: string
  tenantName: string
  logoUrl?: string
  signatureUrl?: string
}

// generateCertificate(enrollmentId: string) - Creates PDF and DB record
// getCertificate(certificateId: string) - Retrieve certificate
// downloadCertificatePDF(certificateId: string) - Stream PDF file
// revokeCertificate(certificateId: string) - Soft delete
```

**Certificate Template** (`backend/src/templates/certificate.html`)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* A4 page size styling */
    /* Border, logo placement, centered text */
    /* Professional certificate design */
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border">
      <img src="{{logoUrl}}" class="logo" />
      <h1>Certificate of Completion</h1>
      <p>This certifies that</p>
      <h2>{{recipientName}}</h2>
      <p>has successfully completed</p>
      <h3>{{courseName}}</h3>
      <p>on {{completionDate}}</p>
      <p class="certificate-number">Certificate #{{certificateNumber}}</p>
      <img src="{{signatureUrl}}" class="signature" />
    </div>
  </div>
</body>
</html>
```

**Auto-Generation Trigger:**
- When `markCourseComplete()` is called (all required modules done + passing quiz scores)
- Check if certificate already exists (don't regenerate)
- Generate sequential certificate number: `CERT-{YEAR}-{TENANT_ID_SHORT}-{SEQUENCE}`
- Store PDF path in database
- Return certificate ID in response

### 2.3 Backend API Endpoints

**Certificate Controller** (`backend/src/controllers/certificateController.ts`)
- `GET /api/certificates/me` - Get user's certificates
- `GET /api/certificates/:id` - Get certificate details
- `GET /api/certificates/:id/download` - Download PDF (authenticated)
- `POST /api/certificates/generate/:enrollmentId` - Manually trigger generation (admin)
- `GET /api/tenants/:tenantId/certificate-template` - Get template config
- `PUT /api/tenants/:tenantId/certificate-template` - Update template (admin)

### 2.4 Frontend Components

**Certificate Display:**
- Show "Download Certificate" button on dashboard when `enrollment.certificateId` exists
- Show certificate icon/badge on completed courses
- Certificate preview modal (shows certificate details before download)

**Certificate Template Editor** (Admin):
- Page: `/admin/tenants/[tenantId]/certificate-template`
- Upload logo and signature images
- Color pickers for background, border, text
- Live preview of certificate template
- Save and test generation

**Tasks:**
- [ ] Install `puppeteer` or `pdfkit` for PDF generation
- [ ] Create certificate HTML template
- [ ] Implement certificate generation service
- [ ] Create certificate download endpoint
- [ ] Add certificate download button to dashboard
- [ ] Create certificate template editor UI (optional, can use defaults first)

---

## Feature 3: Registration Links (Auto-Enrollment)

### 3.1 Database Schema Changes

**New Table: `RegistrationLink`**
```prisma
model RegistrationLink {
  id              String   @id @default(cuid())
  tenantId        String
  courseIds       String[] // Array of course IDs (JSON array)
  token           String   @unique // URL-safe random token
  name            String             // Admin label: "Spring 2026 Cohort"
  maxUses         Int?               // null = unlimited
  usedCount       Int      @default(0)
  expiresAt       DateTime?          // null = never expires
  createdBy       String             // Admin user ID
  createdAt       DateTime @default(now())
  isActive        Boolean  @default(true)
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  creator         User     @relation(fields: [createdBy], references: [id])
  
  @@index([token])
  @@index([tenantId])
  @@index([courseId])
}

model RegistrationLinkUsage {
  id                  String   @id @default(cuid())
  registrationLinkId  String
  userId              String
  usedAt              DateTime @default(now())
  ipAddress           String?
  
  registrationLink    RegistrationLink @relation(fields: [registrationLinkId], references: [id], onDelete: Cascade)
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([registrationLinkId, userId])
  @@index([registrationLinkId])
  @@index([userId])
}
```

**Migration Tasks:**
- [ ] Create migration: `add_registration_links`
- [ ] Add relations to `User`, `Course`, `Tenant`

### 3.2 Registration Link Flow

**Token Generation:**
- Use `crypto.randomBytes(32).toString('base64url')` for URL-safe tokens
- Format: `http://localhost:3000/register?link={TOKEN}`
- Token is cryptographically random and unique

**Registration Process:**
1. User clicks registration link
2. Frontend validates token → `GET /api/registration-links/validate?token={TOKEN}`
3. Show registration form with course info displayed
4. User fills out: email, full name, password
5. Backend creates user account + enrollment simultaneously
6. Increment `usedCount`, create `RegistrationLinkUsage` record
7. Check `maxUses` and `expiresAt` limits
8. Redirect to course or dashboard

**Validation Rules:**
- Token must exist and be active
- Must not be expired (`expiresAt > now()`)
- Must not exceed `maxUses` (`usedCount < maxUses`)
- User email must not already exist in tenant
- User can only use same link once

### 3.3 Backend API Endpoints

**Registration Link Service** (`backend/src/services/registrationLinkService.ts`)
```typescript
interface CreateRegistrationLinkData {
  tenantId: string
  courseIds: string[] // Multiple courses can be assigned via one link
  name: string
  maxUses?: number
  expiresAt?: Date
  createdBy: string
}

// createRegistrationLink(data) - Generate token and create link
// getRegistrationLinks(tenantId: string) - List all links for tenant
// getRegistrationLink(id: string) - Get single link with usage stats
// validateToken(token: string) - Check if token is valid
// useRegistrationLink(token: string, userId: string, ipAddress: string) - Record usage
// updateRegistrationLink(id: string, data) - Update settings
// toggleRegistrationLink(id: string) - Activate/deactivate
// deleteRegistrationLink(id: string) - Delete link
```

**Registration Link Controller** (`backend/src/controllers/registrationLinkController.ts`)
- `POST /api/tenants/:tenantId/registration-links` - Create new link (admin)
- `GET /api/tenants/:tenantId/registration-links` - List links for tenant (admin)
- `GET /api/registration-links/:id` - Get link details with stats (admin)
- `PUT /api/registration-links/:id` - Update link (admin)
- `DELETE /api/registration-links/:id` - Delete link (admin)
- `POST /api/registration-links/:id/toggle` - Activate/deactivate (admin)
- `GET /api/public/registration-links/validate?token={TOKEN}` - Validate token (public)
- `POST /api/public/registration-links/register` - Register via link (public)

**Registration Endpoint:**
```typescript
// POST /api/registration-links/register
// Body: { token, email, fullName, password }
// Process:
// 1. Validate token
// 2. Create user account
// 3. Create enrollment
// 4. Record usage
// 5. Send welcome email
// 6. Return auth token for immediate login
```

### 3.4 Frontend Components

**Admin UI: Registration Links Management**

**Page: `/admin/tenants/[tenantId]/registration-links`** (New page)
- List all registration links for tenant
- Table columns: Name, Courses, Token/URL, Uses, Max Uses, Expires, Status, Actions
- "Copy Link" button for each row
- Create/edit modal
- Usage statistics (who registered via link, when)
- Add "Registration Links" tab/link in tenant detail page navigation

**Create/Edit Modal:**
```tsx
<RegistrationLinkModal>
  <FormInput label="Link Name" placeholder="Spring 2026 Cohort" />
  <MultiSelect label="Courses" options={tenantCourses} />
  <FormInput label="Max Uses" type="number" placeholder="Unlimited" />
  <FormInput label="Expires At" type="datetime-local" />
  <GeneratedLinkDisplay url={generatedUrl} />
  <CopyToClipboard button />
  <SaveButton>Create Link</SaveButton>
</RegistrationLinkModal>
```

**Public Registration Page:**

**Page: `/register?token={TOKEN}`** (New public page)
```tsx
<RegistrationPage>
  <TenantBranding logo={tenantInfo.logo} name={tenantInfo.name} />
  <CoursesListSection courses={coursesList} />
  <RegistrationForm>
    <Input label="Email" type="email" />
    <Input label="Full Name" />
    <Input label="Password" type="password" />
    <Input label="Confirm Password" type="password" />
    <PasswordStrengthIndicator />
    <SubmitButton>Create Account & Get Access</SubmitButton>
  </RegistrationForm>
  <InfoNote>You'll be enrolled in {courseCount} course(s) and redirected to your dashboard</InfoNote>
</RegistrationPage>
```

**Navigation Links:**
- Add "Registration Links" link/tab in tenant detail page navigation (similar to Users, Courses tabs)

### 3.5 Implementation Tasks

**Backend:**
- [ ] Create `RegistrationLink` and `RegistrationLinkUsage` models
- [ ] Run migration
- [ ] Implement `registrationLinkService.ts`
- [ ] Implement `registrationLinkController.ts`
- [ ] Add registration link routes to `backend/src/routes/index.ts`
- [ ] Create public registration endpoint with validation
- [ ] Add IP address tracking middleware

**Frontend:**
- [ ] Create `frontend/pages/admin/tenants/[tenantId]/registration-links.tsx`
- [ ] Add "Registration Links" navigation link in tenant detail page
- [ ] Create `RegistrationLinkTable` component (reuse AdminTable pattern)
- [ ] Create `RegistrationLinkModal` for create/edit
- [ ] Create `frontend/pages/register.tsx` (public page)
- [ ] Add registration link APIs to `frontend/src/lib/api.ts`
- [ ] Add "Copy to Clipboard" functionality
- [ ] Add usage statistics display

---

## Feature 4: Bulk User Management

### 4.1 Database Schema Changes

**New Table: `BulkImportJob`** (Track bulk import operations)
```prisma
model BulkImportJob {
  id              String   @id @default(cuid())
  tenantId        String
  importedBy      String   // Admin user ID
  fileName        String?  // Original CSV filename
  totalRows       Int
  successCount    Int      @default(0)
  failedCount     Int      @default(0)
  status          String   @default("processing") // "processing" | "completed" | "failed"
  sendInvites     Boolean  @default(false)
  errors          String?  // JSON array of error messages
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  importer        User     @relation(fields: [importedBy], references: [id])
  
  @@index([tenantId])
  @@index([importedBy])
}
```

**Migration Tasks:**
- [ ] Create migration: `add_bulk_import_job`
- [ ] Add relation to `Tenant` and `User`

### 4.2 CSV Import Format

**Expected CSV Structure:**
```csv
email,fullName,role,organization
john@example.com,John Doe,learner,Acme Corp
jane@example.com,Jane Smith,instructor,Tech Inc
```

**Supported Fields:**
- `email` (required) - User email address
- `fullName` (optional) - User's full name
- `role` (optional) - User role (defaults to "learner")
- `organization` (optional) - User's organization/company

**Validation Rules:**
- Email format validation
- Duplicate email checking (within CSV and existing users)
- Role must be one of: "admin", "instructor", "learner"
- Max 500 users per import

### 4.3 Backend API Endpoints

**Bulk User Service** (`backend/src/services/bulkUserService.ts`)
```typescript
interface BulkUserData {
  email: string
  fullName?: string
  role?: string
  organization?: string
}

interface BulkImportResult {
  jobId: string
  totalRows: number
  successCount: number
  failedCount: number
  errors: Array<{ row: number; email: string; error: string }>
}

// importUsersFromCSV(tenantId, csvData, sendInvites, importedBy) - Parse and create users
// createUsersInBulk(tenantId, users[], sendInvites, importedBy) - Create multiple users
// getBulkImportJob(jobId) - Get import job status
// getBulkImportJobs(tenantId) - List all import jobs for tenant
```

**Bulk Course Assignment Service** (`backend/src/services/bulkEnrollmentService.ts`)
```typescript
interface BulkEnrollmentData {
  userIds: string[]
  courseIds: string[]
  tenantId: string
}

interface BulkEnrollmentResult {
  totalAttempted: number
  successCount: number
  failedCount: number
  enrollments: Array<{ userId: string; courseId: string; success: boolean; error?: string }>
}

// bulkAssignCourses(data: BulkEnrollmentData) - Assign multiple courses to multiple users
// bulkUnassignCourses(data: BulkEnrollmentData) - Remove course assignments
// getUserCourseSummary(tenantId, userId) - Get all courses for a user
```

**Bulk User Controller** (`backend/src/controllers/bulkUserController.ts`)
- `POST /api/tenants/:tenantId/users/import-csv` - Upload and import CSV (admin)
- `POST /api/tenants/:tenantId/users/bulk-create` - Create multiple users via UI (admin)
- `GET /api/tenants/:tenantId/bulk-imports` - List import jobs (admin)
- `GET /api/bulk-imports/:jobId` - Get import job details (admin)

**Bulk Enrollment Controller** (`backend/src/controllers/bulkEnrollmentController.ts`)
- `POST /api/enrollments/bulk-assign` - Assign courses to multiple users (admin)
- `POST /api/enrollments/bulk-unassign` - Remove course assignments (admin)
- `GET /api/tenants/:tenantId/users/:userId/courses` - Get user's course list (admin)

### 4.4 Frontend Components

**Bulk User Import UI**

**Page: `/admin/tenants/[tenantId]/users/import`**
```tsx
<BulkImportPage>
  <Tabs>
    <Tab label="CSV Upload">
      <CSVUploadZone 
        onFileSelect={handleFileUpload}
        acceptedFormats=".csv"
      />
      <CSVPreviewTable 
        data={parsedCSV}
        validationErrors={errors}
      />
      <ImportOptions>
        <Checkbox label="Send invitation emails to new users" />
      </ImportOptions>
      <ImportButton onClick={submitImport}>
        Import {validRows} Users
      </ImportButton>
    </Tab>
    
    <Tab label="Manual Bulk Add">
      <BulkUserForm>
        <Textarea 
          label="Enter users (one per line)"
          placeholder="john@example.com, John Doe, learner&#10;jane@example.com, Jane Smith, instructor"
        />
        <ImportOptions>
          <Checkbox label="Send invitation emails" />
        </ImportOptions>
        <AddButton>Add Users</AddButton>
      </BulkUserForm>
    </Tab>
    
    <Tab label="Import History">
      <ImportJobsTable>
        {/* Show previous imports with status */}
      </ImportJobsTable>
    </Tab>
  </Tabs>
</BulkImportPage>
```

**Bulk Course Assignment UI**

**Page: `/admin/tenants/[tenantId]/bulk-enroll`** or modal on users page
```tsx
<BulkEnrollmentModal>
  <UserSelector>
    <Checkbox label="Select All" />
    <UserList>
      {users.map(user => (
        <UserCheckbox key={user.id} user={user} />
      ))}
    </UserList>
  </UserSelector>
  
  <CourseSelector>
    <Select
      multiple
      label="Select Courses"
      options={courses}
    />
  </CourseSelector>
  
  <AssignButton onClick={handleBulkAssign}>
    Enroll {selectedUsers.length} users in {selectedCourses.length} courses
  </AssignButton>
</BulkEnrollmentModal>
```

**Navigation:**
- Add "Import Users" button on tenant users page
- Add "Bulk Enroll" button on tenant users page
- Add import history link to admin sidebar

### 4.5 Implementation Tasks

**Backend:**
- [ ] Create `BulkImportJob` model and migration
- [ ] Install CSV parser library (`csv-parse` or `papaparse`)
- [ ] Implement `bulkUserService.ts`
- [ ] Implement `bulkEnrollmentService.ts`
- [ ] Implement bulk user controller
- [ ] Implement bulk enrollment controller
- [ ] Add routes for bulk operations
- [ ] Add validation middleware for CSV upload

**Frontend:**
- [ ] Create bulk user import page
- [ ] Create CSV upload component with drag-and-drop
- [ ] Create CSV preview table with validation
- [ ] Create bulk enrollment modal
- [ ] Add user multi-select functionality
- [ ] Add course multi-select functionality
- [ ] Add import history view
- [ ] Add navigation links

---

## Feature 5: Passwordless Course Access Links

### 5.1 Overview

Simplified authentication flow for learners who don't need full accounts. They access courses via email-based magic codes without setting passwords.

**Key Differences from Registration Links (Feature 3):**
- **Registration Links**: Create full user accounts with passwords
- **Passwordless Access**: No password, sign in via email codes each time

### 5.2 Database Schema Changes

**Update User Model:**
```prisma
model User {
  // ... existing fields
  authMethod      String   @default("password") // "password" | "passwordless"
  organization    String?  // For passwordless users
}
```

**New Table: `PasswordlessAccessLink`**
```prisma
model PasswordlessAccessLink {
  id              String   @id @default(cuid())
  tenantId        String
  courseIds       String[] // Multiple course IDs (JSON array)
  token           String   @unique
  name            String              // Admin label
  organization    String?             // Pre-filled organization
  maxUses         Int?
  usedCount       Int      @default(0)
  expiresAt       DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  isActive        Boolean  @default(true)
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  creator         User     @relation(fields: [createdBy], references: [id])
  
  @@index([token])
  @@index([tenantId])
}

model PasswordlessAccessUsage {
  id                        String   @id @default(cuid())
  passwordlessAccessLinkId  String
  userId                    String
  usedAt                    DateTime @default(now())
  ipAddress                 String?
  
  link                      PasswordlessAccessLink @relation(fields: [passwordlessAccessLinkId], references: [id], onDelete: Cascade)
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([passwordlessAccessLinkId, userId])
  @@index([passwordlessAccessLinkId])
  @@index([userId])
}

model MagicCode {
  id              String   @id @default(cuid())
  userId          String
  code            String   @unique // 6-digit code
  expiresAt       DateTime
  isUsed          Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([code])
  @@index([userId])
  @@index([expiresAt])
}
```

**Migration Tasks:**
- [ ] Create migration: `add_passwordless_access`
- [ ] Add `authMethod` and `organization` to User model
- [ ] Create `PasswordlessAccessLink`, `PasswordlessAccessUsage`, `MagicCode` tables

### 5.3 Authentication Flow

**Registration Flow:**
1. User clicks passwordless access link: `/course-access?token={TOKEN}`
2. System validates token and shows registration form
3. User enters:
   - First Name (required)
   - Last Name (required)
   - Email (required)
   - Organization (pre-filled from link or manual entry)
4. System creates user with `authMethod = "passwordless"` (no password)
5. System enrolls user in specified courses
6. System generates 6-digit magic code
7. Email sent with magic code
8. User redirected to sign-in page

**Sign-In Flow:**
1. User goes to `/login`
2. User enters email only (no password field shown)
3. System checks if user exists and has `authMethod = "passwordless"`
4. System generates 6-digit magic code (expires in 10 minutes)
5. Email sent with code
6. User enters code on verification page
7. System validates code and creates session
8. User redirected to dashboard

**Magic Code Format:**
- 6 digits (e.g., "759382")
- Expires in 10 minutes
- Single use only
- Rate limit for generation: 1 code per 60 seconds per email
- Allow resend after 60 seconds with "Resend Code" button

### 5.4 Backend API Endpoints

**Passwordless Access Service** (`backend/src/services/passwordlessAccessService.ts`)
```typescript
interface CreatePasswordlessLinkData {
  tenantId: string
  courseIds: string[]
  name: string
  organization?: string
  maxUses?: number
  expiresAt?: Date
  createdBy: string
}

interface PasswordlessRegistrationData {
  token: string
  firstName: string
  lastName: string
  email: string
  organization?: string
}

// createPasswordlessLink(data) - Generate link for course access
// getPasswordlessLinks(tenantId, courseId?) - List links
// validatePasswordlessToken(token) - Check if token is valid
// registerViaPasswordlessLink(data) - Create passwordless user + enroll
// updatePasswordlessLink(id, data) - Update link settings
// deletePasswordlessLink(id) - Delete link
```

**Magic Code Service** (`backend/src/services/magicCodeService.ts`)
```typescript
// generateMagicCode(userId) - Create 6-digit code and send email
// validateMagicCode(email, code) - Verify code and mark as used
// cleanupExpiredCodes() - Background job to remove old codes
```

**Passwordless Auth Controller** (`backend/src/controllers/passwordlessAuthController.ts`)
- `GET /api/public/passwordless-links/validate?token={TOKEN}` - Validate token (public)
- `POST /api/public/passwordless-links/register` - Register via passwordless link (public)
- `POST /api/public/auth/send-code` - Request magic code for email (public, rate-limited: 60 sec)
- `POST /api/public/auth/verify-code` - Verify magic code and login (public)
- `POST /api/public/auth/resend-code` - Resend magic code (public, rate-limited: 60 sec)

**Passwordless Link Management Controller**
- `POST /api/tenants/:tenantId/passwordless-links` - Create link (admin)
- `GET /api/tenants/:tenantId/passwordless-links` - List links for tenant (admin)
- `GET /api/passwordless-links/:id` - Get link details (admin)
- `PUT /api/passwordless-links/:id` - Update link (admin)
- `DELETE /api/passwordless-links/:id` - Delete link (admin)
- `POST /api/passwordless-links/:id/toggle` - Activate/deactivate (admin)

### 5.5 Frontend Components

**Admin UI: Passwordless Access Links**

**Page: `/admin/tenants/[tenantId]/passwordless-links`** (New page)
```tsx
<PasswordlessAccessPage>
  <PageHeader>
    <h1 Passwordless Access Links</h1>
    <CreateLinkButton onClick={openModal}>+ Create Link</CreateLinkButton>
  </PageHeader>
  
  <LinksTable>
    <TableHeader>
      <th>Name</th>
      <th>Courses</th>
      <th>Organization</th>
      <th>Uses</th>
      <th>Expires</th>
      <th>Status</th>
      <th>Actions</th>
    </TableHeader>
    <TableBody>
      {links.map(link => (
        <LinkRow>
          <td>{link.name}</td>
          <td>{link.courseIds.length} courses</td>
          <td>{link.organization || '—'}</td>
          <td>{link.usedCount} / {link.maxUses || '∞'}</td>
          <td>{link.expiresAt ? formatDate(link.expiresAt) : 'Never'}</td>
          <td><StatusBadge active={link.isActive} /></td>
          <td>
            <CopyLinkButton url={link.url} />
            <EditButton onClick={() => editLink(link)} />
            <DeleteButton onClick={() => deleteLink(link)} />
          </td>
        </LinkRow>
      ))}
    </TableBody>
  </LinksTable>
</PasswordlessAccessPage>
```

**Create/Edit Passwordless Link Modal:**
```tsx
<PasswordlessLinkModal>
  <FormInput label="Link Name" placeholder="Q1 2026 Training" />
  <MultiSelect label="Courses" options={courses} />
  <FormInput label="Pre-fill Organization" placeholder="Acme Corp" />
  <FormInput label="Max Uses" type="number" placeholder="Unlimited" />
  <FormInput label="Expires At" type="datetime-local" />
  <GeneratedLinkDisplay url={generatedUrl} />
  <CopyToClipboardButton />
  <SaveButton>Create Link</SaveButton>
</PasswordlessLinkModal>
```

**Public Passwordless Registration Page:**

**Page: `/course-access?token={TOKEN}`** (New public page)
```tsx
<PasswordlessRegistrationPage>
  <CourseAccessHeader>
    <h1>Get Course Access</h1>
    <p>You'll be enrolled in {courseCount} course(s)</p>
  </CourseAccessHeader>
  
  <CoursesList>
    {courses.map(course => (
      <CoursePreviewCard course={course} />
    ))}
  </CoursesList>
  
  <RegistrationForm>
    <FormInput label="First Name" required />
    <FormInput label="Last Name" required />
    <FormInput label="Email Address" type="email" required />
    <FormInput 
      label="Organization" 
      defaultValue={prefilledOrg}
      placeholder="Your Company"
    />
    <SubmitButton onClick={handleRegister}>
      Get Access & Send Code
    </SubmitButton>
  </RegistrationForm>
  
  <InfoNote>
    ℹ️ You'll receive an email with a code to access your courses
  </InfoNote>
</PasswordlessRegistrationPage>
```

**Passwordless Login Flow:**

**Page: `/login` (Modified to detect passwordless users)**
```tsx
<LoginPage>
  {/* Standard login form */}
  <FormInput label="Email" onChange={checkAuthMethod} />
  
  {authMethod === 'password' && (
    <FormInput label="Password" type="password" />
  )}
  
  {authMethod === 'passwordless' && (
    <PasswordlessMessageButton onClick={sendMagicCode}>
      Send Login Code to Email
    </PasswordlessMessageButton>
  )}
  
  {codeSent && (
    <MagicCodeInput>
      <FormInput 
        label="Enter 6-Digit Code" 
        maxLength={6}
        pattern="[0-9]{6}"
      />
      <VerifyButton onClick={verifyCode}>Verify & Login</VerifyButton>
      <ResendCodeButton 
        onClick={sendMagicCode} 
        disabled={resendCountdown > 0}
      >
        {resendCountdown > 0 
          ? `Resend Code (${resendCountdown}s)` 
          : 'Resend Code'
        }
      </ResendCodeButton>
    </MagicCodeInput>
  )}
</LoginPage>
```

**Magic Code Email Template:**
```html
<!DOCTYPE html>
<html>
<head><title>Your Login Code</title></head>
<body>
  <h1>Your Login Code</h1>
  <p>Hi {{recipientName}},</p>
  <p>Your login code is:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;">
    {{magicCode}}
  </div>
  <p>This code expires in 10 minutes.</p>
  <p>If you didn't request this code, please ignore this email.</p>
</body>
</html>
```

### 5.6 Implementation Tasks

**Backend:**
- [ ] Add `authMethod` and `organization` to User model
- [ ] Create `PasswordlessAccessLink`, `PasswordlessAccessUsage`, `MagicCode` tables
- [ ] Run migration
- [ ] Implement `passwordlessAccessService.ts`
- [ ] Implement `magicCodeService.ts`
- [ ] Implement controllers for passwordless links and auth
- [ ] Add magic code email template
- [ ] Add rate limiting for magic code requests
- [ ] Create background job to cleanup expired codes
- [ ] Update auth middleware to support passwordless users

**Frontend:**
- [ ] Create `frontend/pages/admin/tenants/[tenantId]/passwordless-links.tsx`
- [ ] Add "Passwordless Links" nav link in tenant detail page
- [ ] Create `frontend/pages/course-access.tsx` (public registration page)
- [ ] Update `frontend/pages/login.tsx` to detect passwordless users
- [ ] Create magic code verification UI in login page
- [ ] Implement "Send Code" functionality with 60-second rate limit
- [ ] Implement "Resend Code" button with countdown timer (disabled during 60s cooldown)
- [ ] Add multi-course selector to link creation modal
- [ ] Update `frontend/pages/admin/tenants/[tenantId]/users.tsx` to show auth method badge
- [ ] Update `frontend/src/lib/api.ts` with passwordless link methods

---

## Implementation Order

### Sprint 1: Foundation & Core Models (Days 1-2)
**Goal:** Set up database schemas for all 5 features

1. [ ] Create migrations for all new models:
   - `Enrollment` (Feature 1)
   - `Certificate` (Feature 2)
   - `RegistrationLink` (Feature 3)
   - `BulkImportJob` (Feature 4)
   - `PasswordlessAccessLink`, `PasswordlessAccessUsage`, `MagicCode` (Feature 5)
   - Add `authMethod` and `organization` to User model (Feature 5)
2. [ ] Run migrations and regenerate Prisma Client
3. [ ] Implement enrollment service & basic API endpoints
4. [ ] Test database models with sample data

### Sprint 2: Learner Dashboard & Enrollments (Days 3-4)
**Goal:** Complete Feature 1 (Learner Dashboard)

1. [ ] Complete enrollment service methods
2. [ ] Create enrollment API endpoints
3. [ ] Build frontend enrollment API integration
4. [ ] Create dashboard page with course cards
5. [ ] Implement progress calculation display
6. [ ] Add navigation to dashboard from header
7. [ ] Test learner enrollment and dashboard display

### Sprint 3: Certificate System (Days 5-6)
**Goal:** Complete Feature 2 (Certificate Generation)

1. [ ] Install Puppeteer dependency
2. [ ] Implement certificate service (PDF generation)
3. [ ] Create certificate HTML template
4. [ ] Build certificate generation on course completion
5. [ ] Create certificate download endpoint
6. [ ] Add certificate display on dashboard
7. [ ] Test certificate generation and download flow

### Sprint 4: Registration Links (Days 7-8)
**Goal:** Complete Feature 3 (Registration Links)

1. [ ] Implement registration link service
2. [ ] Create registration link API endpoints
3. [ ] Build admin UI for managing registration links
4. [ ] Create public registration page
5. [ ] Implement token validation and usage tracking
6. [ ] Add copy-to-clipboard functionality
7. [ ] Integrate navigation in admin
8. [ ] Test complete registration flow

### Sprint 5: Bulk User Management (Days 9-10)
**Goal:** Complete Feature 4 (Bulk User Import & Assignment)

1. [ ] Install CSV parsing library (`csv-parse` or `papaparse`)
2. [ ] Implement bulk user service
3. [ ] Implement bulk enrollment service
4. [ ] Create bulk user import controller
5. [ ] Create bulk enrollment controller
6. [ ] Add API routes for bulk operations
7. [ ] Build CSV upload component with drag-and-drop
8. [ ] Create CSV preview table with validation
9. [ ] Build bulk enrollment modal
10. [ ] Add user/course multi-select functionality
11. [ ] Create import history view
12. [ ] Test CSV import with various data scenarios
13. [ ] Test bulk course assignment flow

### Sprint 6: Passwordless Course Access (Days 11-13)
**Goal:** Complete Feature 5 (Passwordless Authentication)

**Backend:**
1. [ ] Implement passwordless access service
2. [ ] Implement magic code service
3. [ ] Create passwordless auth controller
4. [ ] Create passwordless link management controller
5. [ ] Add magic code email template
6. [ ] Implement rate limiting for magic code requests
7. [ ] Create background job to cleanup expired codes
8. [ ] Update auth middleware to support passwordless users
9. [ ] Add API routes for passwordless features

**Frontend:**
10. [ ] Create passwordless access link management page
11. [ ] Build passwordless registration page
12. [ ] Modify login page to detect passwordless users
13. [ ] Create magic code verification UI
14. [ ] Add "Send Code" functionality to login flow
15. [ ] Implement multi-course selector for link creation
16. [ ] Add navigation links in admin dashboard
17. [ ] Update user list to show auth method badge

**Testing:**
18. [ ] Test passwordless link creation
19. [ ] Test public registration via passwordless link
20. [ ] Test magic code generation and validation
21. [ ] Test magic code expiration
22. [ ] Test rate limiting on code requests

### Sprint 7: Polish, Testing & Documentation (Days 14-15)
**Goal:** Finalize all features and ensure quality

1. [ ] End-to-end testing of all 5 features
2. [ ] Test feature interactions (e.g., bulk assign + dashboard display)
3. [ ] Test error handling and edge cases
4. [ ] UI polish and responsive tweaks
5. [ ] Performance testing (bulk operations, PDF generation)
6. [ ] Security review (token validation, rate limiting, SQL injection)
7. [ ] Update API documentation
8. [ ] Update PROJECT_STATUS.md
9. [ ] Create user guide for admins
10. [ ] Commit and deploy to staging environment

---

## Success Criteria

### Feature 1: Learner Dashboard
- [ ] Learners can see all enrolled courses
- [ ] Progress percentage displayed accurately
- [ ] One-click navigation to course viewer
- [ ] Certificate download available when earned
- [ ] Dashboard shows course completion status
- [ ] Responsive design works on all devices

### Feature 2: Certificate Generation
- [ ] Certificates auto-generated on course completion
- [ ] PDF downloads successfully
- [ ] Certificate includes: student name, course name, completion date, unique number
- [ ] Certificates are tenant-branded (can use global template initially)
- [ ] Certificate download link accessible from dashboard
- [ ] PDF quality is print-ready (300 DPI equivalent)

### Feature 3: Registration Links
- [ ] Admin can create unlimited registration links per course
- [ ] Links can have usage limits and expiration dates
- [ ] Public registration page successfully creates account + enrollment
- [ ] Used link count increments correctly
- [ ] Expired/maxed-out links are rejected
- [ ] Copy-to-clipboard works for easy sharing
- [ ] Links can be activated/deactivated
- [ ] Usage history is tracked

### Feature 4: Bulk User Management
- [ ] CSV upload accepts valid user data format
- [ ] Preview shows all users before import
- [ ] Validation errors displayed clearly per row
- [ ] Import successfully creates all valid users
- [ ] Option to send/skip invitation emails works
- [ ] Import history shows all past imports with status
- [ ] Bulk course assignment enrolls multiple users successfully
- [ ] Multi-select UI for users and courses works intuitively
- [ ] Failed assignments show clear error messages
- [ ] Maximum 500 users per import enforced

### Feature 5: Passwordless Course Access
- [ ] Admin can create passwordless access links
- [ ] Links can include multiple courses
- [ ] Organization field can be pre-filled in link
- [ ] Public registration page creates passwordless user
- [ ] Magic code email sent immediately after registration
- [ ] Login page detects passwordless users and hides password field
- [ ] Magic code generation works and emails arrive
- [ ] Code validation correctly accepts/rejects codes
- [ ] Expired codes are rejected with clear message
- [ ] Rate limiting prevents code spam (3 per hour)
- [ ] Used codes cannot be reused
- [ ] Passwordless users can access dashboard and courses
- [ ] User list shows auth method badge (password vs. passwordless)

---

## Technical Decisions & Notes

### PDF Generation Choice
**Option A: Puppeteer** (HTML to PDF)
- ✅ Easier template design (HTML/CSS)
- ✅ More flexible styling
- ❌ Heavier dependency (Chromium)
- ❌ Slower generation

**Option B: pdfkit** (Direct PDF generation)
- ✅ Lightweight
- ✅ Fast generation
- ❌ More code for positioning elements
- ❌ Less flexible

**Recommendation:** Start with **Puppeteer** for easier template customization. Can optimize later if performance becomes an issue.

### Certificate Storage
- **Initial:** Local filesystem (`backend/uploads/certificates/`)
- **Production:** Migrate to S3 or similar object storage
- **Access:** Serve via authenticated endpoint, not direct file access

### CSV Import Library Choice
**Option A: csv-parse** (Native Node.js streaming)
- ✅ Lightweight
- ✅ Streaming support
- ❌ More setup code

**Option B: papaparse** (Browser & Node.js compatible)
- ✅ Easy to use
- ✅ Better error handling
- ✅ Auto-detection of delimiters
- ❌ Slightly heavier

**Recommendation:** Use **csv-parse** for server-side parsing, **papaparse** for client-side preview (if needed).

### Magic Code Implementation
- **Format:** 6 digits (000000-999999)
- **Generation:** `crypto.randomInt(100000, 999999)`
- **Expiration:** 10 minutes
- **Storage:** Database with index on `code` and `expiresAt`
- **Cleanup:** Background job every 15 minutes to delete expired codes
- **Rate limiting:** 1 code per 60 seconds per email (using in-memory cache or Redis)
- **Resend:** Allow resend after 60 seconds with clear countdown timer in UI

### Registration Link vs Passwordless Access
**Registration Links (Feature 3):**
- Creates full account with password
- One-time use per user
- Traditional login thereafter

**Passwordless Access (Feature 5):**
- No password ever
- Magic code login every time
- Simplified for occasional learners

### Bulk Operations Performance
- **Import limit:** 500 users per CSV
- **Batch size:** Process 50 users at a time
- **Progress tracking:** Update BulkImportJob after each batch
- **Error handling:** Continue on individual failures, collect all errors
- **Transaction strategy:** Use Prisma transactions for enrollment assignments

### Progress Calculation
- **Module completion:** Track via `ModuleCompletion` table
- **Required vs optional:** Only required modules block certificate
- **Quiz passing:** Must pass all required quizzes
- **Certificate eligibility:** 100% of required modules + passing quiz scores

---

## Dependencies & Installation

```bash
# Backend dependencies
cd backend
npm install puppeteer       # For PDF generation (Feature 2)
npm install csv-parse       # For CSV parsing (Feature 4)
npm install multer          # For file uploads (Feature 4)
npm install qrcode          # Optional: Add QR codes to certificates

# Frontend dependencies (if needed)
cd frontend
npm install react-dropzone  # Optional: For drag-and-drop CSV upload (Feature 4)
npm install papaparse       # Optional: For client-side CSV preview (Feature 4)
```

**Environment Variables:**
```bash
# Add to .env for rate limiting (Feature 5)
MAGIC_CODE_EXPIRY_MINUTES=10
MAGIC_CODE_RATE_LIMIT_SECONDS=60
MAX_BULK_IMPORT_SIZE=500
```

---

## API Route Summary

### Enrollments (Feature 1)
```
POST   /api/enrollments
GET    /api/enrollments/me
GET    /api/enrollments/:id/progress
DELETE /api/enrollments/:id
```

### Certificates (Feature 2)
```
GET    /api/certificates/me
GET    /api/certificates/:id
GET    /api/certificates/:id/download
POST   /api/certificates/generate/:enrollmentId
GET    /api/tenants/:tenantId/certificate-template
PUT    /api/tenants/:tenantId/certificate-template
```

### Registration Links (Feature 3)
```
POST   /api/tenants/:tenantId/registration-links    (admin)
GET    /api/tenants/:tenantId/registration-links    (admin)
GET    /api/registration-links/:id                   (admin)
PUT    /api/registration-links/:id                   (admin)
DELETE /api/registration-links/:id                   (admin)
POST   /api/registration-links/:id/toggle            (admin)
GET    /api/public/registration-links/validate?token=...    (public)
POST   /api/public/registration-links/register              (public)
```

### Bulk User Management (Feature 4)
```
POST   /api/tenants/:tenantId/users/import-csv       (admin)
POST   /api/tenants/:tenantId/users/bulk-create      (admin)
GET    /api/tenants/:tenantId/bulk-imports           (admin)
GET    /api/bulk-imports/:jobId                      (admin)
POST   /api/enrollments/bulk-assign                  (admin)
POST   /api/enrollments/bulk-unassign                (admin)
GET    /api/tenants/:tenantId/users/:userId/courses  (admin)
```

### Passwordless Authentication (Feature 5)
```
# Public routes
GET    /api/public/passwordless-links/validate?token=...    (public)
POST   /api/public/passwordless-links/register              (public)
POST   /api/public/auth/send-code                           (public, rate-limited: 60 sec)
POST   /api/public/auth/resend-code                         (public, rate-limited: 60 sec)
POST   /api/public/auth/verify-code                         (public)

# Admin routes
POST   /api/tenants/:tenantId/passwordless-links            (admin)
GET    /api/tenants/:tenantId/passwordless-links            (admin)
GET    /api/passwordless-links/:id                          (admin)
PUT    /api/passwordless-links/:id                          (admin)
DELETE /api/passwordless-links/:id                          (admin)
POST   /api/passwordless-links/:id/toggle                   (admin)
```

---

## Testing Checklist

### Feature 1: Enrollment Testing
- [ ] Enroll user in course via admin
- [ ]User sees course on dashboard
- [ ] Progress updates as modules completed
- [ ] Unenroll removes access from dashboard
- [ ] Multiple enrollments display correctly
- [ ] Progress calculation matches actual completion

### Feature 2: Certificate Testing
- [ ] Complete all required modules
- [ ] Pass all required quizzes
- [ ] Certificate auto-generates
- [ ] PDF downloads successfully
- [ ] Certificate has unique number
- [ ] Re-downloading works (doesn't regenerate)
- [ ] Certificate includes correct student and course info
- [ ] PDF is properly formatted and readable

### Feature 3: Registration Link Testing
- [ ] Create link with no limits
- [ ] Create link with max uses (3)
- [ ] Create link with expiration date
- [ ] Register 3 users via limited link
- [ ] 4th user fails (max uses exceeded)
- [ ] Register after expiration fails
- [ ] Inactive link fails
- [ ] Copy link button works
- [ ] Usage tracking updates correctly
- [ ] Multiple users can register simultaneously

### Feature 4: Bulk User Management Testing

**CSV Import:**
- [ ] Upload valid CSV with 10 users
- [ ] Preview shows all users correctly
- [ ] Import creates all users successfully
- [ ] Upload CSV with validation errors
- [ ] Preview shows errors per row
- [ ] Only valid rows are imported
- [ ] Option to send invites works
- [ ] Option to skip invites works
- [ ] Import history shows all past imports
- [ ] Import job status updates correctly
- [ ] Try uploading 501 users (should fail validation)
- [ ] Duplicate emails within CSV handled correctly
- [ ] Duplicate emails with existing users handled correctly

**Bulk Course Assignment:**
- [ ] Select 5 users from list
- [ ] Select 2 courses
- [ ] Bulk assign enrolls all users in both courses
- [ ] Multi-select UI is intuitive
- [ ] Assignment count displayed correctly
- [ ] Failed assignments show errors
- [ ] Already-enrolled users skipped gracefully
- [ ] Bulk unassign removes multiple enrollments

**Manual Bulk Add:**
- [ ] Enter 10 users via text area
- [ ] Users created successfully
- [ ] Validation errors displayed inline

### Feature 5: Passwordless Authentication Testing

**Link Creation:**
- [ ] Create passwordless access link for 1 course
- [ ] Create passwordless access link for multiple courses
- [ ] Pre-fill organization in link
- [ ] Set max uses and expiration
- [ ] Copy link to clipboard works
- [ ] Link list displays all links correctly
- [ ] Edit link updates settings
- [ ] Delete link removes it
- [ ] Toggle active/inactive works

**Public Registration:**
- [ ] Access passwordless link in browser
- [ ] See course preview on registration page
- [ ] Organization field is pre-filled (if set)
- [ ] Submit registration form
- [ ] User account created with `authMethod = "passwordless"`
- [ ] User enrolled in specified courses
- [ ] Magic code email sent immediately
- [ ] Redirected to login page

**Passwordless Login:**
- [ ] Enter passwordless user email on login page
- [ ] Password field hidden automatically
- [ ] Click "Send Login Code" button
- [ ] Magic code email received
- [ ] Enter correct 6-digit code
- [ ] Successfully logged in
- [ ] Redirected to dashboard
- [ ] Dashboard shows enrolled courses

**Magic Code Security:**
- [ ] Code expires after 10 minutes
- [ ] Used code cannot be reused
- [ ] Incorrect code rejected with error message
- [ ] Request codes within 60 seconds blocked (rate limit enforced)
- [ ] Resend button disabled for 60 seconds with countdown timer
- [ ] Code email arrives within 30 seconds
- [ ] Resend code works correctly after 60-second cooldown

**User Management:**
- [ ] Passwordless users shown in user list
- [ ] Auth method badge displayed (password vs. passwordless)
- [ ] Admin can view passwordless user details
- [ ] Passwordless user progress tracked normally
- [ ] Passwordless user can complete courses
- [ ] Passwordless user can download certificates

---

**End of Phase 9 Plan**
