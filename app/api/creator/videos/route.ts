import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cuePointSchema = z.object({
  timestamp: z.number(),
  questionText: z.string().min(1),
  correctAnswer: z.string().min(1),
  jumpToTime: z.number().nullable().optional(),
  topicId: z.string().nullable().optional(),
})

const schema = z.object({
  title: z.string().min(1),
  muxAssetId: z.string().min(1),
  muxPlaybackId: z.string().optional(),
  primaryTopicId: z.string().optional(),
  cuePoints: z.array(cuePointSchema).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "CREATOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { title, muxAssetId, muxPlaybackId, primaryTopicId, cuePoints } = parsed.data

    const video = await prisma.video.create({
      data: {
        title,
        muxAssetId,
        muxPlaybackId: muxPlaybackId || null,
        creatorId: session.user.id,
        primaryTopicId: primaryTopicId || null,
        cuePoints: cuePoints && cuePoints.length > 0
          ? {
              create: cuePoints.map((cp) => ({
                timestamp: cp.timestamp,
                questionText: cp.questionText,
                correctAnswer: cp.correctAnswer,
                jumpToTime: cp.jumpToTime ?? null,
                topicId: cp.topicId ?? null,
              })),
            }
          : undefined,
      },
      include: {
        cuePoints: true,
      },
    })

    return NextResponse.json({ id: video.id, cuePoints: video.cuePoints.length })
  } catch (error) {
    console.error("Create video error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
