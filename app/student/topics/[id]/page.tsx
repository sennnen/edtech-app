import { requireStudent } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChartBar, Video, BookOpen } from "@phosphor-icons/react/dist/ssr"

export default async function TopicDetail({ params }: { params: { id: string } }) {
  const session = await requireStudent()

  const topic = await prisma.syllabusTopic.findUnique({
    where: { id: params.id },
    include: {
      videos: {
        include: { cuePoints: true },
      },
    },
  })

  if (!topic) notFound()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentProfile: {
        include: {
          weaknesses: {
            where: { topicId: topic.id },
          },
        },
      },
    },
  })

  const weakness = user?.studentProfile?.weaknesses[0]
  const mastery = weakness?.masteryLevel ?? 0

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{topic.title}</h1>
            <p className="text-zinc-500 mt-1">
              {topic.subject} &middot; {topic.board} &middot; Spec: {topic.specCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">Your mastery</p>
            <p className={`text-3xl font-bold ${mastery < 0.5 ? "text-red-500" : mastery < 0.7 ? "text-amber-500" : "text-emerald-500"}`}>
              {Math.round(mastery * 100)}%
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              mastery < 0.5 ? "bg-red-400" : mastery < 0.7 ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${mastery * 100}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recommended videos</h2>
          {topic.videos.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <Video size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No videos available for this topic yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topic.videos.map((v) => (
                <div key={v.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                  <h3 className="font-medium text-zinc-900 text-sm">{v.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{v.cuePoints.length} interactive questions</p>
                  {v.muxPlaybackId ? (
                    <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ready to watch
                    </span>
                  ) : (
                    <span className="inline-block mt-2 text-xs text-zinc-400">No playback ID set</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Practice</h2>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={20} className="text-zinc-400" />
              <div>
                <h3 className="font-medium text-zinc-900 text-sm">Topic drill</h3>
                <p className="text-xs text-zinc-400">5–10 question set targeting this topic</p>
              </div>
            </div>
            {/* [TODO] Implement quiz engine */}
            <p className="text-xs text-zinc-400 italic">Coming soon</p>
          </div>
        </section>
      </div>
    </main>
  )
}
