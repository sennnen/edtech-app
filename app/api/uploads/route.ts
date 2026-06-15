import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { processUpload } from "@/lib/ingestion/processUpload"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawJson, classId } = body

    if (!classId || !rawJson) {
      return NextResponse.json(
        { error: "classId and rawJson are required" },
        { status: 400 }
      )
    }

    const upload = await prisma.mockSpreadsheetUpload.create({
      data: {
        fileUrl: "",
        rawJson,
        status: "PENDING",
        classId,
      },
    })

    const result = await processUpload(upload.id)

    return NextResponse.json({
      uploadId: upload.id,
      status: result.success ? "COMPLETED" : result.manualReview ? "MANUAL_REVIEW" : "FAILED",
      ...result,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
