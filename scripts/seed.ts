import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const org = await prisma.organization.upsert({
    where: { licenseKey: "seed-org-001" },
    update: {},
    create: { name: "Demo School", licenseKey: "seed-org-001" },
  })
  console.log(`  Organization: ${org.id}`)

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
  console.log(`  Teacher: ${teacher.email} / password123`)

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
  console.log(`  Class: ${cls.id} (${cls.name})`)

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

  const student = await prisma.student.upsert({
    where: { id: "demo-student-001" },
    update: {},
    create: {
      id: "demo-student-001",
      name: "Alice Johnson",
      classId: cls.id,
      userId: studentUser.id,
    },
  })
  console.log(`  Student: ${studentUser.email} / password123`)

  const topics = [
    { id: "topic-algebra", title: "Algebra", board: "AQA" as const, subject: "Mathematics", specCode: "ALG" },
    { id: "topic-calculus", title: "Calculus", board: "AQA" as const, subject: "Mathematics", specCode: "CAL" },
    { id: "topic-stats", title: "Statistics", board: "AQA" as const, subject: "Mathematics", specCode: "STA" },
  ]

  for (const t of topics) {
    await prisma.syllabusTopic.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    })
  }
  console.log(`  Topics: ${topics.map((t) => t.title).join(", ")}`)

  const weaknessData = [
    { studentId: student.id, topicId: "topic-algebra", masteryLevel: 0.45 },
    { studentId: student.id, topicId: "topic-calculus", masteryLevel: 0.72 },
    { studentId: student.id, topicId: "topic-stats", masteryLevel: 0.88 },
  ]

  for (const w of weaknessData) {
    await prisma.studentWeakness.upsert({
      where: {
        id: `${w.studentId}-${w.topicId}`,
      },
      update: { masteryLevel: w.masteryLevel },
      create: {
        id: `${w.studentId}-${w.topicId}`,
        ...w,
        lastTestedAt: new Date(),
      },
    })
  }
  console.log(`  Weakness data seeded`)

  console.log("\nDone! You can now sign in:")
  console.log("  Teacher: teacher@demo.com / password123")
  console.log("  Student: student@demo.com / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
