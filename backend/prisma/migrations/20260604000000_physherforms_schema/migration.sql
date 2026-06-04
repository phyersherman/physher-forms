-- PhysherForms migration: Remove LMS tables, add Forms/FormCompletions/VerificationCodes

-- 1. Drop legacy LMS tables (order matters for foreign keys)
DROP TABLE IF EXISTS "PasswordlessAccessUsage" CASCADE;
DROP TABLE IF EXISTS "PasswordlessAccessLink" CASCADE;
DROP TABLE IF EXISTS "RegistrationLinkUsage" CASCADE;
DROP TABLE IF EXISTS "RegistrationLink" CASCADE;
DROP TABLE IF EXISTS "ChapterCompletion" CASCADE;
DROP TABLE IF EXISTS "ModuleCompletion" CASCADE;
DROP TABLE IF EXISTS "QuizAttempt" CASCADE;
DROP TABLE IF EXISTS "Enrollment" CASCADE;
DROP TABLE IF EXISTS "Certificate" CASCADE;
DROP TABLE IF EXISTS "Block" CASCADE;
DROP TABLE IF EXISTS "QuizWidget" CASCADE;
DROP TABLE IF EXISTS "TemplateModuleBlock" CASCADE;
DROP TABLE IF EXISTS "TemplateModule" CASCADE;
DROP TABLE IF EXISTS "CourseTemplate" CASCADE;
DROP TABLE IF EXISTS "Module" CASCADE;
DROP TABLE IF EXISTS "Chapter" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;

-- 2. Remove certificateSignature column from Tenant (if it exists)
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "certificateSignature";

-- 3. Add allowedDomains column to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "allowedDomains" TEXT[] NOT NULL DEFAULT '{}';

-- 4. Create Form table
CREATE TABLE IF NOT EXISTS "Form" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "jotformEmbedUrl" TEXT NOT NULL,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Form_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Form_tenantId_idx" ON "Form"("tenantId");

-- 5. Create FormCompletion table
-- emailHash: SHA-256 of respondent email (never store plaintext here)
-- displayHint: masked email computed at write time e.g. "t***@example.com"
CREATE TABLE IF NOT EXISTS "FormCompletion" (
    "id"          TEXT NOT NULL,
    "emailHash"   TEXT NOT NULL,
    "displayHint" TEXT NOT NULL,
    "formId"      TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormCompletion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FormCompletion_emailHash_formId_key" UNIQUE ("emailHash", "formId"),
    CONSTRAINT "FormCompletion_formId_fkey" FOREIGN KEY ("formId")
        REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FormCompletion_formId_idx" ON "FormCompletion"("formId");
CREATE INDEX IF NOT EXISTS "FormCompletion_emailHash_idx" ON "FormCompletion"("emailHash");

-- 6. Create VerificationCode table (temporary OTP storage)
CREATE TABLE IF NOT EXISTS "VerificationCode" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationCode_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VerificationCode_email_tenantId_idx" ON "VerificationCode"("email", "tenantId");
CREATE INDEX IF NOT EXISTS "VerificationCode_expiresAt_idx" ON "VerificationCode"("expiresAt");
