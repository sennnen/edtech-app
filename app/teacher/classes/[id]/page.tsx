import { requireTeacher } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ChartBar, Users, ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export default async function ClassAnalytics({ params }: { params: { id: string } }) {
  const session = await requireTeacher()

  const cls = await prisma.class.findFirst({
    where: { id: params.id, teacherId: session.user.id },
    include: {
      students: {
        include: {
          weaknesses: {
            include: { topic: true },
          },
        },
      },
      uploads: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!cls) notFound()

  const topicAgg: Record<string, { total: number; count: number; students: { name: string; mastery: number }[] }> = {}
  for (const student of cls.students) {
    for (const w of student.weaknesses) {
      if (!topicAgg[w.topic.title]) {
        topicAgg[w.topic.title] = { total: 0, count: 0, students: [] }
      }
      topicAgg[w.topic.title].total += w.masteryLevel
      topicAgg[w.topic.title].count++
      topicAgg[w.topic.title].students.push({ name: student.name, mastery: w.masteryLevel })
    }
  }

  const topicStats = Object.entries(topicAgg)
    .map(([title, data]) => ({
      title,
      avgMastery: data.total / data.count,
      studentCount: data.count,
      weakestStudents: data.students.sort((a, b) => a.mastery - b.mastery).slice(0, 3),
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">{cls.name}</h1>
        <p className="text-zinc-500 mt-1">{cls.students.length} students &middot; {cls.uploads.length} uploads</p>
      </div>

      {topicStats.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl">
          <ChartBar size={40} className="text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No data yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Upload mock results for this class to see topic-level analytics and student weaknesses.
          </p>
          <Link
            href="/uploads"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Upload results
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {topicStats.map((topic) => (
            <div key={topic.title} className="bg-white border border-zinc-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-900">{topic.title}</h3>
                  <p className="text-xs text-zinc-400">{topic.studentCount} data points</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Class average</p>
                  <p
                    className={`text-xl font-bold ${
                      topic.avgMastery < 0.5
                        ? "text-red-500"
                        : topic.avgMastery < 0.7
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {Math.round(topic.avgMastery * 100)}%
                  </p>
                </div>
              </div>

              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${
                    topic.avgMastery < 0.5
                      ? "bg-red-400"
                      : topic.avgMastery < 0.7
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                  style={{ width: `${topic.avgMastery * 100}%` }}
                />
              </div>

              {topic.weakestStudents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2">Students needing support:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.weakestStudents.map((s) => (
                      <span
                        key={s.name}
                        className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-600 font-medium"
                      >
                        {s.name} — {Math.round(s.mastery * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Students</h2>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-5 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-600">Weakest topic</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-600">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {cls.students.map((s) => {
                const weakest = s.weaknesses.sort((a, b) => a.masteryLevel - b.masteryLevel)[0]
                return (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-5 py-3 font-medium text-zinc-900">{s.name}</td>
                    <td className="px-5 py-3 text-zinc-500">{weakest?.topic.title || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {weakest ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            weakest.masteryLevel < 0.5
                              ? "bg-red-50 text-red-600"
                              : weakest.masteryLevel < 0.7
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {Math.round(weakest.masteryLevel * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
