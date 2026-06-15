-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'CREATOR');

-- CreateEnum
CREATE TYPE "ExamBoard" AS ENUM ('AQA', 'EDEXCEL', 'OCR');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'COMPILING', 'COMPLETED', 'MANUAL_REVIEW');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "role" "UserRole" NOT NULL,
    "name" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsingTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examBoard" "ExamBoard" NOT NULL,
    "schema" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockSpreadsheetUpload" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "parsingSchema" JSONB,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockSpreadsheetUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "board" "ExamBoard" NOT NULL,
    "subject" TEXT NOT NULL,
    "specCode" TEXT NOT NULL,

    CONSTRAINT "SyllabusTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentWeakness" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL,
    "lastTestedAt" TIMESTAMP(3),

    CONSTRAINT "StudentWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "muxAssetId" TEXT NOT NULL,
    "muxPlaybackId" TEXT,
    "creatorId" TEXT NOT NULL,
    "primaryTopicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCuePoint" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "jumpToTime" DOUBLE PRECISION,
    "topicId" TEXT,

    CONSTRAINT "VideoCuePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cuePointId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "rawAnswer" JSONB,
    "marksAwarded" DOUBLE PRECISION,
    "marksAvailable" DOUBLE PRECISION,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_licenseKey_key" ON "Organization"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "ParsingTemplate_organizationId_subject_examBoard_idx" ON "ParsingTemplate"("organizationId", "subject", "examBoard");

-- CreateIndex
CREATE INDEX "MockSpreadsheetUpload_classId_status_idx" ON "MockSpreadsheetUpload"("classId", "status");

-- CreateIndex
CREATE INDEX "SyllabusTopic_board_specCode_subject_idx" ON "SyllabusTopic"("board", "specCode", "subject");

-- CreateIndex
CREATE INDEX "StudentWeakness_studentId_topicId_idx" ON "StudentWeakness"("studentId", "topicId");

-- CreateIndex
CREATE INDEX "QuestionResponse_studentId_answeredAt_idx" ON "QuestionResponse"("studentId", "answeredAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockSpreadsheetUpload" ADD CONSTRAINT "MockSpreadsheetUpload_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWeakness" ADD CONSTRAINT "StudentWeakness_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWeakness" ADD CONSTRAINT "StudentWeakness_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_primaryTopicId_fkey" FOREIGN KEY ("primaryTopicId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCuePoint" ADD CONSTRAINT "VideoCuePoint_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCuePoint" ADD CONSTRAINT "VideoCuePoint_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_cuePointId_fkey" FOREIGN KEY ("cuePointId") REFERENCES "VideoCuePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
