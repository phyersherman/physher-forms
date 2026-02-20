-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "certificateId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authMethod" TEXT NOT NULL DEFAULT 'password',
ADD COLUMN     "organization" TEXT;

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfPath" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseIds" TEXT[],
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RegistrationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationLinkUsage" (
    "id" TEXT NOT NULL,
    "registrationLinkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationLinkUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImportJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "fileName" TEXT,
    "totalRows" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "sendInvites" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordlessAccessLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseIds" TEXT[],
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PasswordlessAccessLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordlessAccessUsage" (
    "id" TEXT NOT NULL,
    "passwordlessAccessLinkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "PasswordlessAccessUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

-- CreateIndex
CREATE INDEX "Certificate_tenantId_idx" ON "Certificate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationLink_token_key" ON "RegistrationLink"("token");

-- CreateIndex
CREATE INDEX "RegistrationLink_token_idx" ON "RegistrationLink"("token");

-- CreateIndex
CREATE INDEX "RegistrationLink_tenantId_idx" ON "RegistrationLink"("tenantId");

-- CreateIndex
CREATE INDEX "RegistrationLinkUsage_registrationLinkId_idx" ON "RegistrationLinkUsage"("registrationLinkId");

-- CreateIndex
CREATE INDEX "RegistrationLinkUsage_userId_idx" ON "RegistrationLinkUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationLinkUsage_registrationLinkId_userId_key" ON "RegistrationLinkUsage"("registrationLinkId", "userId");

-- CreateIndex
CREATE INDEX "BulkImportJob_tenantId_idx" ON "BulkImportJob"("tenantId");

-- CreateIndex
CREATE INDEX "BulkImportJob_importedBy_idx" ON "BulkImportJob"("importedBy");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordlessAccessLink_token_key" ON "PasswordlessAccessLink"("token");

-- CreateIndex
CREATE INDEX "PasswordlessAccessLink_token_idx" ON "PasswordlessAccessLink"("token");

-- CreateIndex
CREATE INDEX "PasswordlessAccessLink_tenantId_idx" ON "PasswordlessAccessLink"("tenantId");

-- CreateIndex
CREATE INDEX "PasswordlessAccessUsage_passwordlessAccessLinkId_idx" ON "PasswordlessAccessUsage"("passwordlessAccessLinkId");

-- CreateIndex
CREATE INDEX "PasswordlessAccessUsage_userId_idx" ON "PasswordlessAccessUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordlessAccessUsage_passwordlessAccessLinkId_userId_key" ON "PasswordlessAccessUsage"("passwordlessAccessLinkId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicCode_code_key" ON "MagicCode"("code");

-- CreateIndex
CREATE INDEX "MagicCode_code_idx" ON "MagicCode"("code");

-- CreateIndex
CREATE INDEX "MagicCode_userId_idx" ON "MagicCode"("userId");

-- CreateIndex
CREATE INDEX "MagicCode_expiresAt_idx" ON "MagicCode"("expiresAt");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "ModuleCompletion_userId_idx" ON "ModuleCompletion"("userId");

-- CreateIndex
CREATE INDEX "ModuleCompletion_moduleId_idx" ON "ModuleCompletion"("moduleId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_blockId_idx" ON "QuizAttempt"("blockId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCompletion" ADD CONSTRAINT "ModuleCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationLink" ADD CONSTRAINT "RegistrationLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationLinkUsage" ADD CONSTRAINT "RegistrationLinkUsage_registrationLinkId_fkey" FOREIGN KEY ("registrationLinkId") REFERENCES "RegistrationLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationLinkUsage" ADD CONSTRAINT "RegistrationLinkUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkImportJob" ADD CONSTRAINT "BulkImportJob_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordlessAccessLink" ADD CONSTRAINT "PasswordlessAccessLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordlessAccessUsage" ADD CONSTRAINT "PasswordlessAccessUsage_passwordlessAccessLinkId_fkey" FOREIGN KEY ("passwordlessAccessLinkId") REFERENCES "PasswordlessAccessLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordlessAccessUsage" ADD CONSTRAINT "PasswordlessAccessUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicCode" ADD CONSTRAINT "MagicCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
