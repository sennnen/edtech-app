import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InteractiveLesson from "@/app/(student)/components/InteractiveLesson"

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: true,
      weaknesses: {
        include: { topic: true },
        orderBy: { masteryLevel: "asc" },
        take: 5,
      },
    },
  })

  if (!student) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Student profile not found</h1>
        <p className="mt-2 text-gray-600">Please contact your teacher.</p>
      </main>
    )
  }

  const recommendedVideo = await prisma.video.findFirst({
    where: student.weaknesses.length > 0
      ? { primaryTopicId: student.weaknesses[0].topicId }
      : undefined,
    include: {
      cuePoints: true,
    },
  })

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome, {student.name} &middot; Class: {student.class.name}
      </p>

      {student.weaknesses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Areas to improve</h2>
          <div className="grid gap-3">
            {student.weaknesses.map((w) => (
              <div
                key={w.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between"
              >
                <span className="font-medium">{w.topic.title}</span>
                <span className="text-sm text-gray-500">
                  Mastery: {Math.round(w.masteryLevel * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendedVideo && (
        <section>
          <h2 className="text-xl font-semibold mb-3">
            Recommended Lesson: {recommendedVideo.title}
          </h2>
          {recommendedVideo.muxPlaybackId && (
            <InteractiveLesson
              playbackId={recommendedVideo.muxPlaybackId}
              cuePoints={recommendedVideo.cuePoints.map((cp) => ({
                id: cp.id,
                timestamp: cp.timestamp,
                questionText: cp.questionText,
                correctAnswer: cp.correctAnswer,
                jumpToTime: cp.jumpToTime,
                topicId: cp.topicId,
              }))}
              studentId={student.id}
            />
          )}
        </section>
      )}

      {!recommendedVideo && (
        <div className="text-center py-16 text-gray-500">
          <p>No recommended lessons yet.</p>
          <p className="text-sm mt-1">Upload mock results to get started.</p>
        </div>
      )}
    </main>
  )
}
