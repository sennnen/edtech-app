import { requireStudent } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChartBar, Video, GraduationCap, BookOpen, ArrowRight } from "@phosphor-icons/react/dist/ssr"

export default async function StudentDashboard() {
  const session = await requireStudent()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentProfile: {
        include: {
          class: {
            include: { organization: true },
          },
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

  const weakestTopic = weakTopics[0]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            {student.name} &middot; {student.class?.name || "No class"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {student.class?.organization && (
            <span className="text-xs text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full">
              {student.class.organization.name}
            </span>
          )}
          <div className="text-right">
            <p className="text-xs text-zinc-500">Overall mastery</p>
            <p className="text-2xl font-bold text-zinc-900">{Math.round(avgMastery * 100)}%</p>
          </div>
        </div>
      </div>

      {weakTopics.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={18} className="text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Top 3 weakest topics</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weakTopics.slice(0, 3).map((w) => (
              <Link
                key={w.id}
                href={`/student/topics/${w.topicId}`}
                className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-zinc-900 text-sm">{w.topic.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{w.topic.board} &middot; {w.topic.specCode}</p>
                  </div>
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
              </Link>
            ))}
          </div>
        </section>
      )}

      {weakestTopic && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Video size={18} className="text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-900">Recommended action</h2>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <p className="text-sm text-zinc-700 mb-1">Focus on <strong>{weakestTopic.topic.title}</strong></p>
            <p className="text-xs text-zinc-400 mb-4">
              {weakestTopic.topic.board} &middot; {weakestTopic.topic.subject} &middot; Spec: {weakestTopic.topic.specCode}
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700">
                <Video size={14} />
                Interactive video
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700">
                <BookOpen size={14} />
                Practice quiz
              </span>
            </div>
            {/* [TODO] Flashcard decks, spaced repetition */}
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
                  <div>
                    <h3 className="font-medium text-zinc-900 text-sm">{w.topic.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{w.topic.board}</p>
                  </div>
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
