import { prisma } from "@/lib/prisma"
import type { ExamBoard } from "@prisma/client"

type SourceKey = string
type TargetKey = "student_name" | "mock_score" | "syllabus_topic"
type ColumnMapping = Record<SourceKey, TargetKey>

interface TemplateResult {
  template: {
    id: string
    schema: ColumnMapping
    confidence: number
    modelName: string
  } | null
  manualReview: boolean
  errors: string[]
}

const ALLOWED_TARGETS = new Set<TargetKey>([
  "student_name",
  "mock_score",
  "syllabus_topic",
])

function isTargetKey(value: string): value is TargetKey {
  return ALLOWED_TARGETS.has(value as TargetKey)
}

export function callLLMToGenerateMap(
  sample: Record<string, string>[]
): { schema: ColumnMapping; confidence: number; modelName: string } {
  const headers = sample.length > 0 ? Object.keys(sample[0]) : []

  const schema: ColumnMapping = {}
  for (const header of headers) {
    const lower = header.toLowerCase()
    if (lower.includes("name") || lower.includes("student")) {
      schema[header] = "student_name"
    } else if (
      lower.includes("mark") ||
      lower.includes("score") ||
      lower.includes("grade") ||
      lower.includes("result")
    ) {
      schema[header] = "mock_score"
    } else if (lower.includes("topic") || lower.includes("subject") || lower.includes("syllabus")) {
      schema[header] = "syllabus_topic"
    }
  }

  return {
    schema,
    confidence: 0.92,
    modelName: "gpt-4o-mini-stub-2024-05-13",
  }
}

function validateMapping(
  schema: ColumnMapping,
  sample: Record<string, string>[]
): string[] {
  const errors: string[] = []

  for (const [source, target] of Object.entries(schema)) {
    if (!isTargetKey(target)) {
      errors.push(`Invalid target key "${target}" for source "${source}"`)
      continue
    }
    if (target === "mock_score") {
      let numericCount = 0
      for (const row of sample) {
        const val = row[source]
        if (val !== undefined && val !== "" && !isNaN(Number(val))) {
          numericCount++
        }
      }
      const ratio = sample.length > 0 ? numericCount / sample.length : 0
      if (ratio < 0.9) {
        errors.push(
          `Source "${source}" mapped to "mock_score" but only ${Math.round(
            ratio * 100
          )}% of sample values parse as numbers (need >= 90%)`
        )
      }
    }
  }

  return errors
}

export async function getOrCreateParsingTemplate({
  organizationId,
  subject,
  examBoard,
  sample,
}: {
  organizationId: string
  subject: string
  examBoard: ExamBoard
  sample: Record<string, string>[]
}): Promise<TemplateResult> {
  const existing = await prisma.parsingTemplate.findFirst({
    where: {
      organizationId,
      subject,
      examBoard,
    },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    return {
      template: {
        id: existing.id,
        schema: existing.schema as ColumnMapping,
        confidence: existing.confidence,
        modelName: existing.modelName,
      },
      manualReview: false,
      errors: [],
    }
  }

  const { schema, confidence, modelName } = callLLMToGenerateMap(sample)

  const errors = validateMapping(schema, sample)

  if (confidence < 0.9 || errors.length > 0) {
    return {
      template: null,
      manualReview: true,
      errors,
    }
  }

  const created = await prisma.parsingTemplate.create({
    data: {
      organizationId,
      subject,
      examBoard,
      schema,
      confidence,
      modelName,
    },
  })

  return {
    template: {
      id: created.id,
      schema: created.schema as ColumnMapping,
      confidence: created.confidence,
      modelName: created.modelName,
    },
    manualReview: false,
    errors: [],
  }
}
