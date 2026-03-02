# LMS Project Status

**Last Updated:** February 23, 2026  
**Project:** Multi-tenant, white-label LMS (Node.js/Next.js)  
**Location:** `/Users/hubby/Library/CloudStorage/OneDrive-SharedLibraries-RheapData/Company Files - Documents/LMS`

## 🎯 Project Overview

A multi-tenant LMS framework where:
- Single codebase serves many course portals (each tenant)
- Each tenant has isolated domain, users, content, and branding
- On-prem friendly with cloud portability
- Admin interface for creating/editing courses with a Squarespace-like lesson editor
- Multi-tenant learner dashboard with enrollment, certificates, and passwordless authentication

---

## ✅ Completed Project Phases

### Phases 1-2: Foundation & Git (DONE)
**Summary:** Multi-tenant architecture with course/chapter/module structure, block-based Squarespace-style lesson editor, and git version control initialized.

### Phase 3: Editor Improvements (DONE)
### Phase 3: Editor Improvements (DONE)
**Summary:** Rich text editor with Tiptap, enhanced blocks (Quote with attribution, Button with styling), and course copy functionality with full structure preservation and ID remapping.

### Phase 4: Learner Experience - Quiz & Gating (DONE)
**Summary:** Quiz/assignment blocks with question management, learner-facing quiz interface, module completion tracking, prerequisite enforcement, and access control with lock icons.

### Phase 5: Polish & Optimization (DONE)
**Summary:** Quiz analytics dashboard with score statistics, distributions, performance trends, time limits with countdown timers and visual warnings.

### Phase 6: Code Cleanup (DONE)
**Summary:** Centralized API client covering all endpoints, block component abstraction (~40% code reduction), form components library, backend service optimization (courseService split into focused modules).

### Phase 7: Multi-Tenant Admin Features (DONE)
**Summary:** Tenant management UI, user CRUD with status management, email configuration with Mailgun integration, invite/password reset flows with security (rate limiting, CSRF, encryption, bcrypt hashing).

### Phase 8: (SKIPPED - Infrastructure deferred)

### Phase 9: Learner Experience Enhancement (DONE)
**Summary:** 
- **Sprint 1-2:** Enrollment system with progress tracking, learner dashboard with course cards
- **Sprint 3:** Certificate generation with unique numbers and PDF storage
- **Sprint 4:** Registration links with cryptographic tokens for auto-enrollment
- **Sprint 5:** Bulk user CSV import (up to 500 users) and M×N course assignment
- **Sprint 6:** Passwordless authentication with 6-digit magic codes and email verification

### Phase 9.5: Admin UI for Phase 9 (DONE)
**Summary:** 5 comprehensive admin pages - Enrollments management, Certificates management, Registration Links manager, Passwordless Links manager, Bulk Operations (CSV import + bulk assign) with tabbed navigation on tenant detail page.

---

## 🚀 Future Roadmap

Starting fresh: All planned features from Phase 1 forward.

### Phase 1: Course CSV Import/Export
**Objective:** Enable admins to bulk import courses and export existing courses as CSV for backup/migration.

#### 1.1 Course Export to CSV
- **Backend API:** `GET /api/tenants/:tenantId/courses/:courseId/export` returns CSV file
- **CSV Structure:**
  ```
  courseTitle,description,status,chapterName,moduleTitle,modulePosition,blockType,blockContent,blockConfig
  ```
- **Feature Details:**
  - Export single course or batch export all courses in tenant
  - Include full course structure (chapters, modules, blocks) in flat CSV
  - Downloadable via admin UI button
  - Timestamps and metadata preserved

#### 1.2 Course Import from CSV
- **Backend API:** `POST /api/tenants/:tenantId/courses/import` accepts CSV file
- **CSV Format (same as export):**
  - Parse chapters (group by chapterName)
  - Parse modules (group by module title within chapters)
  - Auto-create blocks based on blockType and blockContent
  - Support for all 6 block types (Text, Image, Video, Quote, Button, Quiz)
- **Features:**
  - Validation: Check for required fields, valid block types
  - Error reporting: Per-row error messages with line numbers
  - Conflict handling: Option to update existing courses or create new
  - Progress tracking: Import job status with success/failure counts
  - Rollback: If errors detected, option to review before committing

#### 1.3 Admin UI
- **Page:** `/admin/tenants/[tenantId]/courses/import-export`
- **Export Tab:**
  - All courses table with "Export" button per course
  - "Export All Courses" button
  - Download history
- **Import Tab:**
  - Drag-and-drop CSV upload zone
  - Preview table of parsed data before import
  - Import mode selector: "Create New" vs "Update Existing"
  - Conflict resolution UI
  - Error report display
- **Migration Tab:**
  - Transfer courses between tenants (already exists, enhance UI)

#### 1.4 Implementation Tasks
- CSV parsing library (`csv-parse` or `papaparse`)
- Course flatten/unflatten logic for CSV
- Validation and error tracking
- Backend endpoints for import/export
- UI with upload/download
- Testing with various CSV formats

---

### Phase 2: Advanced Quiz Features
**Objective:** Expand quiz capabilities with more question types, branching logic, and proctoring options.

#### 2.1 Extended Question Types
- **Survey questions** (rating scales, Likert, free text)
- **Matching questions** (connect items)
- **Fill-in-the-blank** with multiple answer variations
- **Essay questions** with rubric-based grading
- **Question pools** / randomized question selection

#### 2.2 Conditional Branching
- Show/hide questions based on previous answers
- Skip questions based on conditions
- Adaptive difficulty (show harder questions if user scores high)
- Recommended resources based on weak areas

#### 2.3 Grading & Feedback
- Automated rubric-based essay grading
- Instructor manual grading UI
- Detailed feedback per question
- Answer rationale/explanation showing
- Performance compare to class average

---

### Phase 3: Analytics & Reporting
**Objective:** Comprehensive learner and course analytics for instructors and admins.

#### 3.1 Learner Analytics
- **Dashboard per learner:**
  - Learning time per course
  - Quiz performance trends
  - Module completion timeline
  - Engagement score (interactions, time spent)
  - Milestones achieved

#### 3.2 Course Analytics
- Course completion rates
- Module-level performance heatmap
- Quiz question difficulty analysis
- Time spent per module trends
- Learner cohort comparisons

#### 3.3 Reports & Export
- Pre-built report templates (performance, engagement, completion)
- Custom report builder
- Scheduled report email delivery
- Export to PDF, Excel, CSV
- Data visualization (charts, graphs)

#### 3.4 Admin Dashboard
- Tenant-wide metrics (total learners, courses, enrollments)
- Growth trends (new enrollments, completion rates)
- System health (API uptime, error rates)
- Usage analytics (feature adoption, popular courses)

---

### Phase 4: Course Customization & Templates
**Objective:** Pre-built course templates and customization options for faster course creation.

#### 4.1 Course Templates Library
- Pre-designed course templates (business, tech, languages, etc.)
- One-click course creation from template
- Editable template components
- Community template marketplace

#### 4.2 Learning Pathways
- Multi-course learning paths
- Prerequisite courses
- Linear vs non-linear progression
- Recommended next courses based on performance

#### 4.3 Branding Customization
- Per-tenant theme settings (already exists, enhance)
- Course-level branding overrides
- Custom CSS injection (safe sandbox)
- Logo and header image per course
- Custom color schemes

#### 4.4 Accessibility Features
- Screen reader optimization
- Caption/transcript support per video
- Keyboard navigation enhancements
- WCAG 2.1 AA compliance verification
- Multiple language support (i18n)

---

### Phase 5: Platform Expansion
**Objective:** New modalities and educational formats.
**Objective:** New modalities and educational formats.

#### 13.1 Live Sessions & Webinars
- Live class scheduling
- Video conferencing (Zoom/Jitsi integration)
- Recording and playback
- Q&A during live sessions
- Office hours scheduling

#### 5.2 Microlearning
- Bite-sized micro-courses
- Spaced repetition algorithm
- Mobile-optimized mini-lessons
- Micro-credential badges

#### 5.3 Classroom Blend
- Hybrid learning support
- In-person + online content
- Classroom synchronization
- Attendance tracking


---

## � Phase 1: Course CSV Import/Export - PLANNING

### Overview
Enable admins to bulk import courses from CSV files and export existing courses as CSV for backup, migration, and content reuse. This feature reduces manual course creation time from hours to minutes.

### Phase 1.1: Design Decisions

**Simplifications made to avoid bloat:**
1. **No new services** - Extend existing `courseService.ts` with CSV methods instead of creating separate services
2. **No new database models** - Skip ImportJob tracking for Phase 1 (return results directly from API)
3. **No async progress** - Simple request/response (user waits ~5-30 seconds)
4. **Reuse existing components** - Use AdminLayout, AdminTable, existing CSS instead of building new UI
5. **Four endpoints total** - Export, Import, Preview, Template (not 6+)
6. **Simple error handling** - Collect errors and return in one response
7. **No undo/rollback UI** - Single transaction approach (all or nothing)

**Result:** Lightweight feature (1-2 KB of new code) that integrates seamlessly with existing architecture.

---

### Phase 1.2: CSV Schema Design

#### CSV Export Format
Export a course as a flat CSV with rows representing blocks in sequence:

```
courseTitle,courseDescription,chapterName,chapterOrder,moduleTitle,moduleOrder,blockType,blockOrder,blockTitle,blockContent,blockConfig
Professional Writing 101,Master business writing skills,Chapter 1: Foundations,1,Lesson 1: Email Writing,1,text,,Email Communication,Write clear emails,"{""alignment"":""left"",""fontSize"":""16""}"
Professional Writing 101,Master business writing skills,Chapter 1: Foundations,1,Lesson 1: Email Writing,1,image,2,Email Example,"https://example.com/email.jpg","{""width"":""600"",""height"":""400""}"
Professional Writing 101,Master business writing skills,Chapter 1: Foundations,1,Lesson 2: Reports,2,text,,Report Writing,Structure your reports...,"{""alignment"":""left""}"
```

**CSV Columns (in order):**
- `courseTitle` (required) - Name of the course
- `courseDescription` (optional) - Course description/summary
- `chapterName` (required) - Name of chapter/section
- `chapterOrder` (required, numeric) - Order within course (1, 2, 3...)
- `moduleTitle` (required) - Name of lesson/module
- `moduleOrder` (required, numeric) - Order within chapter (1, 2, 3...)
- `blockType` (required) - Type of block: `text`, `image`, `video`, `quote`, `button`, `quiz`
- `blockOrder` (required, numeric) - Order within module (1, 2, 3...)
- `blockTitle` (optional) - Display title for block
- `blockContent` (optional) - Main content (text, image URL, video URL, quote text, button text, etc.)
- `blockConfig` (optional) - JSON string with block-specific configuration

**Block Type-Specific Fields:**
- **Text blocks:** `blockContent` = text body, `blockConfig` = alignment, fontSize, etc.
- **Image blocks:** `blockContent` = image URL, `blockConfig` = width, height, alt text, caption
- **Video blocks:** `blockContent` = video URL, `blockConfig` = width, height, autoplay, controls
- **Quote blocks:** `blockContent` = quote text, `blockConfig` = attribution, color
- **Button blocks:** `blockContent` = button text, `blockConfig` = URL, size, alignment, color, openNewTab
- **Quiz blocks:** `blockContent` = ""(empty), `blockConfig` = questions array with type, options, correctAnswer

#### CSV Import Format
Same as export format above. Multiple rows for same course create multiple blocks in same course.

**Validation Rules:**
- At least one course required
- At least one chapter per course
- At least one module per chapter
- At least one block per module (or optional blocks allowed?)
- Block types must be valid (6 types allowed)
- Orders must be sequential positive integers
- JSON config must be valid JSON (or empty string)
- URLs in image/video must be valid format
- No duplicate course titles in same import

#### CSV Error Handling
If CSV is invalid, return detailed error with line numbers:
```json
{
  "success": false,
  "errors": [
    { "line": 5, "field": "blockType", "message": "Invalid block type 'podcast'. Valid types: text, image, video, quote, button, quiz" },
    { "line": 8, "field": "blockConfig", "message": "Invalid JSON: Unexpected token }" },
    { "line": 10, "field": "chapterOrder", "message": "Expected number, got 'abc'" }
  ]
}
```

---

### Phase 1.3: Backend Implementation Plan

#### Extend courseService with CSV Methods
**File:** `backend/src/services/courseService.ts` (extend existing)

**New methods to add:**
- `exportCourseAsCSV(courseId: string): Promise<string>` - Convert course to CSV string
- `flattenCourseToCSVRows(course: CourseWithChapters): string[][]` - Helper to flatten structure
- `parseImportCSV(csvContent: string): ParsedCoursesData` - Parse CSV string to objects
- `validateParsedCourses(courses: ParsedCoursesData): ValidationResult` - Validate structure
- `importCoursesFromParsed(parsed: ParsedCoursesData, tenantId: string): ImportResult` - Create courses from parsed data

**Simpler Interfaces (Phase 1):**
```typescript
// Input from CSV parsing
interface ParsedCourse {
  title: string
  description?: string
  chapters: ParsedChapter[]
}

interface ParsedChapter {
  name: string
  order: number
  modules: ParsedModule[]
}

interface ParsedModule {
  title: string
  order: number
  blocks: ParsedBlock[]
}

interface ParsedBlock {
  type: 'text' | 'image' | 'video' | 'quote' | 'button' | 'quiz'
  order: number
  title?: string
  content?: string
  config?: Record<string, any>
}

// Validation results
interface ValidationError {
  line: number
  field: string
  message: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  parseErrors: string[] // CSV parsing errors
}

// Import results
interface ImportResult {
  success: boolean
  totalParsed: number
  importedCount: number
  importedIds: string[] // Course IDs created
  conflicts: { courseTitle: string; existingId: string }[]
  errors: ValidationError[]
}
```

**How it integrates:**
These new methods are added to the existing `courseService.ts`. Leverage existing:
- `courseService.createCourse()` for bulk course creation
- `chapterService`, `moduleService`, `blockService` for nested structure creation
- Prisma transaction for atomic imports (all or nothing on error)

#### Backend API Endpoints

**Add these to `backend/src/routes/index.ts` after course routes:**

1. `GET /tenants/:tenantId/courses/:courseId/export`
   - **Auth:** `requireRoleAuth(['admin'])`
   - **Returns:** CSV as file with Content-Disposition header
   - **Example:** `GET /tenants/tenant-123/courses/course-456/export`
   - **Response:** CSV string (file download)

2. `POST /tenants/:tenantId/courses/import`
   - **Auth:** `requireRoleAuth(['admin'])`
   - **Body:** `{ csvContent: string }`
   - **Returns:** `ImportResult`
   - **Example:** `POST /tenants/tenant-123/courses/import`
   - **Response:**
     ```json
     {
       "success": true,
       "totalParsed": 3,
       "importedCount": 3,
       "importedIds": ["course-1", "course-2", "course-3"],
       "conflicts": [],
       "errors": []
     }
     ```

3. `POST /tenants/:tenantId/courses/import-preview`
   - **Auth:** `requireRoleAuth(['admin'])`
   - **Body:** `{ csvContent: string }`
   - **Returns:** Validation result without creating courses
   - **Example:** `POST /tenants/tenant-123/courses/import-preview`
   - **Response:**
     ```json
     {
       "valid": true,
       "errors": [],
       "parseErrors": []
     }
     ```

4. `GET /courses/csv-template`
   - **Auth:** `requireRoleAuth(['admin'])`
   - **Returns:** Example CSV string with headers and 2 sample rows
   - **Purpose:** Download template for users to fill in

#### Controller Implementation
**File:** `backend/src/controllers/courseController.ts` (extend existing)

Add methods directly to existing controller:
- `exportCourseAsCSV(req, res)` - Call courseService.exportCourseAsCSV()
- `importCoursesFromCSV(req, res)` - Parse CSV from request body, call courseService methods
- `previewImport(req, res)` - Validate without committing
- `downloadCSVTemplate(req, res)` - Return example CSV string

No need for separate controllers. Reuse existing error handling and auth patterns.

---

### Phase 1.4: Frontend Implementation Plan

#### Tenant Dashboard Integration
**Update:** `frontend/pages/admin/tenants/[tenantId].tsx`

Add navigation tab in the "Navigation Tabs" section (after Bulk Operations, before Email Config):
```tsx
<Link
  href={`/admin/tenants/${tenantId}/course-import-export`}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: router.pathname.includes('/course-import-export') ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : '#f1f5f9',
    color: router.pathname.includes('/course-import-export') ? 'white' : '#334155',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s',
    border: router.pathname.includes('/course-import-export') ? 'none' : '1px solid #e2e8f0',
  }}
>
  <span>📥📤</span>
  <span>Import/Export</span>
</Link>
```

**New File:** `frontend/pages/admin/tenants/[tenantId]/course-import-export.tsx`

Add course import/export as a new tab in the tenant dashboard (alongside bulk-operations, email-config, users, etc.)

**Route:** `/admin/tenants/[tenantId]/course-import-export`
- **Pattern:** Follows existing tenant dashboard structure (see bulk-operations.tsx, users.tsx)
- **Auth:** Automatically tenant-scoped via `tenantId` from URL
- **Layout:** Wrap with `AdminLayout`

**Two-tab interface using existing patterns:**
- **Tab 1: Export Courses** - List tenant's courses with checkboxes + export button
- **Tab 2: Import Courses** - File upload form + preview/import flow

**Code structure matches existing tenant pages:**
```tsx
const { tenantId } = router.query

const [courses, setCourses] = useState<Course[]>([])
const [loading, setLoading] = useState(false)
const [csvContent, setCsvContent] = useState('')
const [importResult, setImportResult] = useState(null)

useEffect(() => {
  if (!tenantId) return
  loadCourses()
}, [tenantId])

const loadCourses = async () => {
  const data = await api.getTenantCourses(tenantId as string)
  setCourses(Array.isArray(data) ? data : [])
}

const handleExport = async (courseId: string) => {
  const csv = await fetch(`/api/tenants/${tenantId}/courses/${courseId}/export`, {
    credentials: 'include'
  }).then(r => r.text())
  // Download file
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${findCourse(courseId).title}.csv`
  a.click()
}

const handleImport = async () => {
  const result = await fetch(`/api/tenants/${tenantId}/courses/import`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvContent })
  }).then(r => r.json())
  setImportResult(result)
  if (result.success) loadCourses()
}
```

**Uses existing patterns:**
- `AdminLayout` wrapper
- `AdminTable` for course listings
- `styles.primaryButton`, `styles.header`, `styles.empty` from `admin-table.module.css`
- Same tab pattern as bulk-operations.tsx

**Tab 1 - Export:**
```tsx
// List courses with checkboxes for export
const [selectedIds, setSelectedIds] = useState<string[]>([])

return (
  <div>
    <h3>Export Courses</h3>
    <AdminTable
      columns={[
        { key: 'title', header: 'Course Title' },
        { key: 'id', header: 'Action', render: (id) => (
          <button onClick={() => handleExport(id)}>Export</button>
        )}
      ]}
      data={courses}
      loading={loading}
    />
  </div>
)
```

**Tab 2 - Import:**
```tsx
// File upload + optional preview
const [file, setFile] = useState<File | null>(null)
const [importing, setImporting] = useState(false)

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0]
  if (f && f.name.endsWith('.csv')) setFile(f)
}

const handleDownloadTemplate = async () => {
  const csv = await fetch(`/api/courses/csv-template`, {
    credentials: 'include'
  }).then(r => r.text())
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'course-template.csv'
  a.click()
}

const handleImportClick = async () => {
  if (!file) return alert('Select a CSV file')
  const text = await file.text()
  const result = await fetch(`/api/tenants/${tenantId}/courses/import`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvContent: text })
  }).then(r => r.json())
  
  if (result.success) {
    setSuccess(`✓ Imported ${result.importedCount} courses`)
    loadCourses()
  } else {
    setError(`✗ Import failed: ${result.errors.map(e => e.message).join(', ')}`)
  }
}

return (
  <div>
    <h3>Import Courses from CSV</h3>
    <p>
      <button onClick={handleDownloadTemplate} style={{ marginBottom: '16px' }}>
        📥 Download Sample Template
      </button>
    </p>
    <input
      type="file"
      accept=".csv"
      onChange={handleFileSelect}
    />
    <button onClick={handleImportClick}>
      {importing ? 'Importing...' : 'Import'}
    </button>
    {success && <p style={{ color: 'green' }}>{success}</p>}
    {error && <p style={{ color: 'red' }}>{error}</p>}
    {importResult && (
      <div>
        <p>Created: {importResult.importedIds.join(', ')}</p>
        {importResult.errors.length > 0 && (
          <div>
            <h4>Errors:</h4>
            {importResult.errors.map((e, i) => (
              <p key={i}>{e.message}</p>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)
```

#### API Client Methods
**Update:** `frontend/src/lib/api.ts`

```typescript
// Add to api object:
export const courseCSV = {
  exportCourse: (tenantId: string, courseId: string) =>
    fetch(`${API_BASE}/tenants/${tenantId}/courses/${courseId}/export`, {
      credentials: 'include'
    }).then(r => r.text()),
  
  importCourses: (tenantId: string, csvContent: string) =>
    fetchJson(`/tenants/${tenantId}/courses/import`, {
      method: 'POST',
      body: JSON.stringify({ csvContent })
    }),
  
  previewImport: (tenantId: string, csvContent: string) =>
    fetchJson(`/tenants/${tenantId}/courses/import-preview`, {
      method: 'POST',
      body: JSON.stringify({ csvContent })
    }),
  
  getCSVTemplate: () =>
    fetch(`${API_BASE}/courses/csv-template`, { credentials: 'include' })
      .then(r => r.text())
}
```

#### Styling
**Reuse existing CSS:**
- `admin-table.module.css` for `.header`, `.primaryButton`, `.secondaryButton`, `.empty`
- `shared.module.css` for button and form styles
- No new CSS needed for Phase 1

**Component structure:**
- File upload: Use standard HTML `<input type="file" accept=".csv" />`
- Upload zone: Use simple `<div>` with border-dashed styling (minimal)
- Tables: Use existing `AdminTable` component
- Errors/warnings: Use color coding (red for errors, yellow for warnings)

---

### Phase 1.5: Testing Plan

#### Backend Unit Tests
**File:** `backend/src/services/courseService.test.ts`

Test the new CSV methods:
1. `parseImportCSV()` - Valid CSV parses correctly
2. `parseImportCSV()` - Invalid JSON in config column shows errors
3. `validateParsedCourses()` - Detects duplicate course titles
4. `validateParsedCourses()` - Detects invalid block types (not text/image/video/quote/button/quiz)
5. `flattenCourseToCSVRows()` - Complete course flattens to expected rows
6. `importCoursesFromParsed()` - Successfully creates courses with chapters/modules/blocks
7. Round-trip: Create course → flatten to CSV → import → compare

#### Frontend Tests (Manual + Basic)
1. **Export:** Select course → Click export → Verify CSV downloads with correct filename
2. **Import:** Upload valid CSV → Preview shows correct counts → Import succeeds
3. **Error Handling:** Upload malformed CSV → Errors display with line numbers
4. **Template Download:** Click "Download Template" → CSV file downloads
5. **Conflict Detection:** Upload course with duplicate title → Shows conflict warning

#### No End-to-End tests required for Phase 1
Keep it simple. Manual testing on a browser is fine to validate.

---

### Phase 1.6: Data Integrity & Performance

#### Transaction Handling
- Use Prisma transaction: If any course fails to import, entire import rolls back
- Simple approach: `prisma.$transaction(async (tx) => { ... })`
- This ensures DB consistency (all courses created or none created)

#### Performance
- CSV parsing: Synchronous, fast enough for files with 100+ courses
- Database inserts: Batch create chapters/modules/blocks per course (Prisma auto-optimizes)
- Target: <5 seconds for 10 courses, <30 seconds for 100 courses on standard hardware
- No async progress tracking needed for Phase 1 (user waits for response)

#### Error Handling
- Line-by-line validation before database transaction
- Collect all errors and return them in one response
- If critical error (e.g., invalid CSV), stop with clear message
- If data error (e.g., duplicate title), include in errors array but don't stop processing

#### No Rollback UI
Phase 1: Once import completes, that's it. No undo button.
- Users can always delete courses manually if needed
- Future phases: Add import job history + undo capability

---

### Phase 1.7: Documentation

#### For Admin Users
- **CSV Format Guide:** Explain each column (courseTitle, chapterName, moduleTitle, etc.)
- **Block Type Reference:** Show examples for each type (text, image, video, quote, button, quiz)
- **Example CSV Files:** Provide 2-3 sample CSVs they can download and modify
- **Troubleshooting:** Common errors and how to fix (invalid block type, duplicate course title, malformed JSON)

#### For Developers
- **CSV Schema:** Detailed field definitions and constraints
- **API Reference:** cURL examples for export, import, preview, template endpoints
- **Error Codes:** Reference of possible validation errors
- **Code Comments:** Well-commented parseImportCSV() and flattenCourseToCSVRows() methods

**Location:** Add to README.md or create `PHASE_1_CSV_GUIDE.md`

---

```
LMS/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, tenant resolver
│   │   ├── routes/         # Express routes
│   │   └── db/             # Prisma client
│   └── prisma/             # Database schema & migrations
├── frontend/               # Next.js React app
│   ├── pages/
│   │   ├── admin/         # Admin interface
│   │   └── course/        # Learner course view
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── auth/          # Auth provider & protected routes
│   │   ├── lib/           # API client
│   │   ├── theme/         # Theme provider
│   │   └── hooks/         # Custom hooks
│   └── styles/            # Global styles
├── .git/                   # Git repository
├── GIT_WORKFLOW.md         # Git workflow documentation
└── PROJECT_STATUS.md       # This file
```

## 🔧 Tech Stack

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL
- **Frontend:** Next.js, React, TypeScript, CSS Modules
- **Database:** PostgreSQL (production), SQLite (development)
- **Version Control:** Git
- **Email:** Mailgun (transactional)
- **Auth:** JWT + HTTP-only cookies, Bcrypt hashing

## 👤 Key Conventions

- **Files:** kebab-case (e.g., `tenant-service.ts`)
- **Classes/Types:** PascalCase (e.g., `TenantService`, `CourseData`)
- **Functions/Variables:** camelCase (e.g., `resolveTenant()`)
- **Database:** snake_case columns (e.g., `tenant_id`, `course_title`)
- **Multi-tenancy:** All data scoped by `tenantId` field

## 📝 Git History

```
Phase 9.5 (Latest):
  - 5 comprehensive admin pages for enrollment, certificates, registration links, passwordless links, bulk operations
  - Tabbed navigation on tenant detail page
  - ~2,700 lines of new frontend code

Phase 9 (7 sprints):
  - Enrollment system with progress tracking
  - Certificate generation with unique numbers
  - Registration links with cryptographic tokens
  - Bulk user CSV import (500 user limit)
  - Passwordless authentication with magic codes

Previous Phases:
  - Multi-tenant foundation with block-based editor
  - Rich text editor, enhanced blocks
  - Quiz/assignment with gating and prerequisites
  - Quiz analytics with score distributions
  - Code cleanup and optimization
  - User management and email integration
```

To view full history: `git log --oneline -30`

## 🎯 Development Priorities

### High Priority (Roadmap Focus)
1. **Phase 1: Course CSV Import/Export** - Enable bulk course management
2. **Phase 2: Advanced Quiz Features** - Expand assessment capabilities with conditional branching, multiple question types, and grading
3. **Phase 3: Analytics & Reporting** - Comprehensive instructor insights and learner analytics
4. **Phase 4: Course Customization & Templates** - Faster course creation and learning pathways
5. **Phase 5: Platform Expansion** - Live sessions, microlearning, and hybrid learning support

## 🔴 Known Issues & Limitations

1. **Mobile Responsiveness:** Learner interface needs optimization for tablets/phones
2. **Certificate Design:** Currently text placeholder, needs real PDF with tenant branding
3. **Quiz Link Support:** Rich text editor doesn't support links yet (can be added later)
4. **API Rate Limiting:** Basic rate limiting in place, needs refinement for high-load scenarios

## 🎓 How to Resume Development

```bash
# Check current status
cd "/Users/hubby/Library/CloudStorage/OneDrive-SharedLibraries-RheapData/Company Files - Documents/LMS"
git status
git log --oneline -5

# Start Phase 1 (CSV Import/Export)
git checkout -b feature/phase-1-csv-import-export
# Make changes
git add -A
git commit -m "feat(phase1): Course CSV import/export"
```

## 📚 Key Files to Know

- **API Client:** `frontend/src/lib/api.ts`
- **Block Components:** `frontend/src/components/BlockEditor/blocks/`
- **Enrollment Service:** `backend/src/services/enrollment-service.ts`
- **Certificate Service:** `backend/src/services/certificate-service.ts`
- **Admin Pages:** `frontend/pages/admin/tenants/[tenantId]/`

## 💡 Recommended First Phase Steps

For Phase 1 (CSV Import/Export):
1. Design CSV schema for courses with nested structure
2. Implement FlattenCourse utility (course → CSV rows)
3. Implement UnflattenCourse utility (CSV rows → course)
4. Create backend `/export` and `/import` endpoints
5. Add validation and error reporting
6. Create admin UI for import/export
7. Test with sample CSV files

---

**Ready to start Phase 1! 🚀**
