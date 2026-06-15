import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...\n")

  const org = await prisma.organization.upsert({
    where: { licenseKey: "seed-org-001" },
    update: {},
    create: { name: "Demo School", licenseKey: "seed-org-001" },
  })
  console.log(`  ✓ Organization: ${org.name}`)

  const teacherPassword = await hash("password123", 12)
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@demo.com" },
    update: {},
    create: {
      email: "teacher@demo.com",
      hashedPassword: teacherPassword,
      name: "Mr. Smith",
      role: "TEACHER",
      organizationId: org.id,
    },
  })

  const cls = await prisma.class.upsert({
    where: { id: "demo-class-001" },
    update: {},
    create: {
      id: "demo-class-001",
      name: "Maths A-Level",
      orgId: org.id,
      teacherId: teacher.id,
    },
  })
  console.log(`  ✓ Class: ${cls.name}`)

  const studentPassword = await hash("password123", 12)
  const studentUser = await prisma.user.upsert({
    where: { email: "student@demo.com" },
    update: {},
    create: {
      email: "student@demo.com",
      hashedPassword: studentPassword,
      name: "Alice Johnson",
      role: "STUDENT",
      organizationId: org.id,
    },
  })

  await prisma.student.upsert({
    where: { id: "demo-student-001" },
    update: {},
    create: {
      id: "demo-student-001",
      name: "Alice Johnson",
      classId: cls.id,
      userId: studentUser.id,
    },
  })
  console.log(`  ✓ Student: Alice Johnson`)

  await prisma.student.upsert({
    where: { id: "demo-student-002" },
    update: {},
    create: {
      id: "demo-student-002",
      name: "Bob Smith",
      classId: cls.id,
    },
  })
  console.log(`  ✓ Student: Bob Smith`)

  await prisma.student.upsert({
    where: { id: "demo-student-003" },
    update: {},
    create: {
      id: "demo-student-003",
      name: "Charlie Brown",
      classId: cls.id,
    },
  })
  console.log(`  ✓ Student: Charlie Brown`)

  const adminPassword = await hash("password123", 12)
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      hashedPassword: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      organizationId: org.id,
    },
  })
  console.log(`  ✓ Admin: admin@demo.com / password123`)

  const creatorPassword = await hash("password123", 12)
  const creator = await prisma.user.upsert({
    where: { email: "creator@demo.com" },
    update: {},
    create: {
      email: "creator@demo.com",
      hashedPassword: creatorPassword,
      name: "Science Shorts",
      role: "CREATOR",
      organizationId: org.id,
    },
  })
  console.log(`  ✓ Creator: creator@demo.com / password123`)

  const topics = [
    { id: "topic-algebra", title: "Algebra", board: "AQA" as const, subject: "Mathematics", specCode: "8300" },
    { id: "topic-calculus", title: "Calculus", board: "AQA" as const, subject: "Mathematics", specCode: "8300" },
    { id: "topic-stats", title: "Statistics", board: "EDEXCEL" as const, subject: "Mathematics", specCode: "1MA1" },
    { id: "topic-mechanics", title: "Mechanics", board: "OCR" as const, subject: "Physics", specCode: "H556" },
  ]

  for (const t of topics) {
    await prisma.syllabusTopic.upsert({ where: { id: t.id }, update: {}, create: t })
  }
  console.log(`  ✓ Topics: ${topics.map((t) => t.title).join(", ")}`)

  const weaknessData = [
    { id: "w-alice-algebra", studentId: "demo-student-001", topicId: "topic-algebra", masteryLevel: 0.45 },
    { id: "w-alice-calculus", studentId: "demo-student-001", topicId: "topic-calculus", masteryLevel: 0.72 },
    { id: "w-alice-stats", studentId: "demo-student-001", topicId: "topic-stats", masteryLevel: 0.88 },
    { id: "w-bob-algebra", studentId: "demo-student-002", topicId: "topic-algebra", masteryLevel: 0.62 },
    { id: "w-bob-calculus", studentId: "demo-student-002", topicId: "topic-calculus", masteryLevel: 0.31 },
    { id: "w-bob-mechanics", studentId: "demo-student-002", topicId: "topic-mechanics", masteryLevel: 0.55 },
    { id: "w-charlie-stats", studentId: "demo-student-003", topicId: "topic-stats", masteryLevel: 0.29 },
    { id: "w-charlie-algebra", studentId: "demo-student-003", topicId: "topic-algebra", masteryLevel: 0.81 },
  ]

  for (const w of weaknessData) {
    await prisma.studentWeakness.upsert({
      where: { id: w.id },
      update: { masteryLevel: w.masteryLevel, lastTestedAt: new Date() },
      create: { ...w, lastTestedAt: new Date() },
    })
  }
  console.log(`  ✓ Weakness data seeded`)

  if (creator) {
    await prisma.video.upsert({
      where: { id: "demo-video-001" },
      update: {},
      create: {
        id: "demo-video-001",
        title: "Introduction to Algebra",
        muxAssetId: "demo-asset",
        muxPlaybackId: null,
        creatorId: creator.id,
        primaryTopicId: "topic-algebra",
        cuePoints: {
          create: [
            {
              timestamp: 15,
              questionText: "What is 2x + 3 = 7? Solve for x.",
              correctAnswer: "2",
              jumpToTime: 10,
              topicId: "topic-algebra",
            },
            {
              timestamp: 45,
              questionText: "Factorise x² + 5x + 6",
              correctAnswer: "(x+2)(x+3)",
              jumpToTime: null,
              topicId: "topic-algebra",
            },
          ],
        },
      },
    })
    console.log(`  ✓ Demo video created`)
  }

  console.log("\n────────────────────────────")
  console.log("  Seed complete! Sign in:")
  console.log("────────────────────────────")
  console.log("  Teacher:  teacher@demo.com / password123")
  console.log("  Student:  student@demo.com / password123")
  console.log("  Admin:    admin@demo.com / password123")
  console.log("  Creator:  creator@demo.com / password123")
  console.log("────────────────────────────")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
