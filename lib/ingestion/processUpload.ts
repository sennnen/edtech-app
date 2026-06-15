import { prisma } from "@/lib/prisma"
import type { UploadStatus } from "@prisma/client"
import { getOrCreateParsingTemplate } from "@/lib/ingestion/parsingTemplate"

export async function processUpload(uploadId: string): Promise<{ success: boolean; manualReview?: boolean; errors?: string[] }> {
  const upload = await prisma.mockSpreadsheetUpload.findUnique({
    where: { id: uploadId },
    include: {
      class: {
        include: {
          organization: true,
        },
      },
    },
  })

  if (!upload) {
    return { success: false, errors: ["Upload not found"] }
  }

  const rawData = upload.rawJson as Record<string, string>[]
  if (!Array.isArray(rawData) || rawData.length === 0) {
    await setStatus(upload.id, "MANUAL_REVIEW")
    return { success: false, manualReview: true, errors: ["Raw data is empty or not an array"] }
  }

  const sample = rawData.slice(0, 3)

  await setStatus(upload.id, "COMPILING")

  const result = await getOrCreateParsingTemplate({
    organizationId: upload.class.orgId,
    subject: "General",
    examBoard: "AQA" as any,
    sample,
  })

  if (result.manualReview || !result.template) {
    await setStatus(upload.id, "MANUAL_REVIEW")
    return { success: false, manualReview: true, errors: result.errors }
  }

  const { schema } = result.template

  const sourceToStudentName = findSourceKey(schema, "student_name")
  const sourceToScore = findSourceKey(schema, "mock_score")
  const sourceToTopic = findSourceKey(schema, "syllabus_topic")

  const studentScores: Map<string, Map<string, { obtained: number; available: number; count: number }>> = new Map()

  for (const row of rawData) {
    const studentName = sourceToStudentName ? (row[sourceToStudentName]?.trim() || "Unknown") : "Unknown"
    const scoreStr = sourceToScore ? row[sourceToScore] : undefined
    const topicStr = sourceToTopic ? row[sourceToTopic]?.trim() || "General" : "General"

    const score = scoreStr !== undefined ? parseFloat(scoreStr) : NaN

    let student = await prisma.student.findFirst({
      where: { name: studentName, classId: upload.classId },
    })

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: studentName,
          classId: upload.classId,
        },
      })
    }

    let topic = await prisma.syllabusTopic.findFirst({
      where: { title: topicStr },
    })

    if (!topic) {
      topic = await prisma.syllabusTopic.create({
        data: {
          title: topicStr,
          board: "AQA",
          subject: "General",
          specCode: "GEN",
        },
      })
    }

    if (!isNaN(score)) {
      const available = 1
      const obtained = score / 100
      const key = `${student.id}:${topic.id}`

      if (!studentScores.has(key)) {
        studentScores.set(key, new Map())
      }
      const topicMap = studentScores.get(key)!
      const existing = topicMap.get(topicStr) || { obtained: 0, available: 0, count: 0 }
      topicMap.set(topicStr, {
        obtained: existing.obtained + obtained,
        available: existing.available + available,
        count: existing.count + 1,
      })
    }
  }

  for (const [key, topicMap] of Array.from(studentScores.entries())) {
    const [studentId, topicId] = key.split(":")
    for (const [, agg] of Array.from(topicMap.entries())) {
      const masteryLevel = agg.available > 0 ? agg.obtained / agg.available : 0

      const existingWeakness = await prisma.studentWeakness.findFirst({
        where: { studentId, topicId },
      })

      if (existingWeakness) {
        await prisma.studentWeakness.update({
          where: { id: existingWeakness.id },
          data: {
            masteryLevel,
            lastTestedAt: new Date(),
          },
        })
      } else {
        await prisma.studentWeakness.create({
          data: {
            studentId,
            topicId,
            masteryLevel,
            lastTestedAt: new Date(),
          },
        })
      }
    }
  }

  await prisma.mockSpreadsheetUpload.update({
    where: { id: upload.id },
    data: {
      status: "COMPLETED",
      parsingSchema: schema,
    },
  })

  return { success: true }
}

function findSourceKey(
  schema: Record<string, string>,
  target: string
): string | undefined {
  return Object.entries(schema).find(([, v]) => v === target)?.[0]
}

async function setStatus(id: string, status: UploadStatus) {
  await prisma.mockSpreadsheetUpload.update({
    where: { id },
    data: { status },
  })
}
