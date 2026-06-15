import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processUpload } from "@/lib/ingestion/processUpload"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { rawJson, classId, mapping, subject, examBoard, specCode } = body

    if (!classId || !rawJson) {
      return NextResponse.json(
        { error: "classId and rawJson are required" },
        { status: 400 }
      )
    }

    const classRecord = await prisma.class.findFirst({
      where: {
        id: classId,
        ...(session.user.role === "TEACHER" ? { teacherId: session.user.id } : {}),
      },
    })

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const upload = await prisma.mockSpreadsheetUpload.create({
      data: {
        fileUrl: "",
        rawJson,
        status: "PENDING",
        classId,
      },
    })

    const result = await processUpload(upload.id, {
      subject: subject || "General",
      examBoard: examBoard || "AQA",
      specCode,
      forceMapping: mapping || null,
    })

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
