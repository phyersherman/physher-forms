-- CreateTable
CREATE TABLE "ChapterCompletion" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapterCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChapterCompletion_userId_idx" ON "ChapterCompletion"("userId");

-- CreateIndex
CREATE INDEX "ChapterCompletion_chapterId_idx" ON "ChapterCompletion"("chapterId");

-- AddForeignKey
ALTER TABLE "ChapterCompletion" ADD CONSTRAINT "ChapterCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
