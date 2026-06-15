import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChartBar, Video, GraduationCap, ArrowRight } from "@phosphor-icons/react/dist/ssr"

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentProfile: {
        include: {
          class: true,
          weaknesses: {
            include: { topic: true },
            orderBy: { masteryLevel: "asc" },
          },
        },
      },
    },
  })

  if (!user?.studentProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">No student profile yet</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Your teacher needs to add you to a class. Uploaded mock results will create your profile automatically.
          </p>
          <Link
            href="/uploads"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Go to uploads
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  const student = user.studentProfile
  const weakTopics = student.weaknesses.filter((w) => w.masteryLevel < 0.7)
  const strongTopics = student.weaknesses.filter((w) => w.masteryLevel >= 0.7)
  const avgMastery =
    student.weaknesses.length > 0
      ? student.weaknesses.reduce((s, w) => s + w.masteryLevel, 0) / student.weaknesses.length
      : 0

  const recommendedVideo = await prisma.video.findFirst({
    where: weakTopics.length > 0 ? { primaryTopicId: weakTopics[0].topicId } : undefined,
    include: { cuePoints: true },
  })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            {student.name} &middot; {student.class?.name || "No class"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Overall mastery</p>
          <p className="text-2xl font-bold text-zinc-900">{Math.round(avgMastery * 100)}%</p>
        </div>
      </div>

      {weakTopics.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Areas to improve</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weakTopics.map((w) => (
              <div key={w.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zinc-900 text-sm">{w.topic.title}</h3>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {Math.round(w.masteryLevel * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${w.masteryLevel * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {strongTopics.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Strong areas</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strongTopics.map((w) => (
              <div key={w.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zinc-900 text-sm">{w.topic.title}</h3>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {Math.round(w.masteryLevel * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${w.masteryLevel * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendedVideo && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Video size={18} className="text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-900">{recommendedVideo.title}</h2>
          </div>
          {recommendedVideo.muxPlaybackId ? (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
                Video player — add MUX_TOKEN_ID & MUX_TOKEN_SECRET to .env
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <Video size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No video configured yet</p>
            </div>
          )}
        </section>
      )}

      {student.weaknesses.length === 0 && (
        <div className="text-center py-20">
          <ChartBar size={40} className="text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No results yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Your teacher needs to upload mock exam results. Once they do, your weak areas and recommended lessons will show up here.
          </p>
        </div>
      )}
    </main>
  )
}
