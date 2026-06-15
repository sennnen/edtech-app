import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { cuePointId, isCorrect, rawAnswer, marksAwarded, marksAvailable } = body

    if (cuePointId === undefined || isCorrect === undefined) {
      return NextResponse.json(
        { error: "cuePointId and isCorrect are required" },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        class: {
          include: { organization: true },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    if (cuePointId) {
      const cuePoint = await prisma.videoCuePoint.findUnique({
        where: { id: cuePointId },
        include: {
          video: {
            include: {
              creator: true,
            },
          },
        },
      })

      if (cuePoint?.video?.creator?.organizationId) {
        const studentOrgId = student.class.orgId
        const cueOrgId = cuePoint.video.creator.organizationId
        if (studentOrgId !== cueOrgId) {
          return NextResponse.json({ error: "Organization mismatch" }, { status: 403 })
        }
      }
    }

    const response = await prisma.questionResponse.create({
      data: {
        studentId: student.id,
        cuePointId: cuePointId || null,
        isCorrect,
        rawAnswer: rawAnswer || null,
        marksAwarded: marksAwarded ?? null,
        marksAvailable: marksAvailable ?? null,
      },
    })

    return NextResponse.json({ responseId: response.id })
  } catch (error) {
    console.error("Video event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
