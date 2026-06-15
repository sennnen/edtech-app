import { requireTeacher } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, Upload, ArrowRight } from "@phosphor-icons/react/dist/ssr"

const statusColors: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  COMPILING: "bg-blue-50 text-blue-600",
  COMPLETED: "bg-emerald-50 text-emerald-600",
  MANUAL_REVIEW: "bg-amber-50 text-amber-600",
}

export default async function TeacherDashboard() {
  const session = await requireTeacher()

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { students: true } },
      uploads: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const recentUploads = await prisma.mockSpreadsheetUpload.findMany({
    where: {
      class: { teacherId: session.user.id },
    },
    include: {
      class: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Teacher Dashboard</h1>
        <p className="text-zinc-500 mt-1">Manage your classes, upload mocks, and track student progress.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{classes.length}</p>
              <p className="text-sm text-zinc-500">Classes</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            {classes.reduce((s, c) => s + c._count.students, 0)} total students
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Upload size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{recentUploads.length}</p>
              <p className="text-sm text-zinc-500">Uploads</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            {recentUploads.filter((u) => u.status === "COMPLETED").length} completed
          </p>
        </div>
        <Link
          href="/uploads"
          className="bg-zinc-900 text-white rounded-2xl p-6 hover:bg-zinc-800 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <Upload size={20} />
            <span className="font-medium">Upload mock results</span>
          </div>
          <p className="text-sm text-zinc-400">CSV upload with AI column mapping</p>
          <ArrowRight size={16} className="mt-3 text-zinc-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Your classes</h2>
          {classes.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <Users size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No classes yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900">{cls.name}</h3>
                    <span className="text-sm text-zinc-500">{cls._count.students} students</span>
                  </div>
                  {cls.uploads.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cls.uploads.slice(0, 3).map((u) => (
                        <span
                          key={u.id}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[u.status] || "bg-zinc-100 text-zinc-600"}`}
                        >
                          {u.status.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent uploads</h2>
          {recentUploads.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <Upload size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No uploads yet. Upload a CSV to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUploads.map((u) => (
                <div key={u.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{u.class.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[u.status] || "bg-zinc-100 text-zinc-600"}`}
                    >
                      {u.status === "MANUAL_REVIEW"
                        ? "Manual review"
                        : u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
