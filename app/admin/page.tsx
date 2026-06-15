import { requireAdmin } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import { WarningCircle, CheckCircle, Clock, FileCsv } from "@phosphor-icons/react/dist/ssr"

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  COMPILING: Clock,
  MANUAL_REVIEW: WarningCircle,
  COMPLETED: CheckCircle,
}

const statusColors: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-600",
  COMPILING: "bg-blue-50 text-blue-600",
  MANUAL_REVIEW: "bg-amber-50 text-amber-600",
  COMPLETED: "bg-emerald-50 text-emerald-600",
}

export default async function AdminPage() {
  await requireAdmin()

  const pendingUploads = await prisma.mockSpreadsheetUpload.findMany({
    where: { status: { in: ["PENDING", "COMPILING", "MANUAL_REVIEW"] } },
    include: {
      class: {
        include: {
          organization: { select: { name: true } },
          teacher: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const templates = await prisma.parsingTemplate.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const completedCount = await prisma.mockSpreadsheetUpload.count({
    where: { status: "COMPLETED" },
  })
  const totalStudents = await prisma.student.count()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Admin</h1>
        <p className="text-zinc-500 mt-1">Manage uploads, templates, and users.</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-zinc-900">{pendingUploads.length}</p>
          <p className="text-sm text-zinc-500">Needs review</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-zinc-900">{completedCount}</p>
          <p className="text-sm text-zinc-500">Completed uploads</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-zinc-900">{totalStudents}</p>
          <p className="text-sm text-zinc-500">Students</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-zinc-900">{templates.length}</p>
          <p className="text-sm text-zinc-500">Parsing templates</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Upload review queue</h2>
          {pendingUploads.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No uploads pending review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUploads.map((u) => {
                const StatusIcon = statusIcons[u.status] || Clock
                return (
                  <div key={u.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{u.class.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {u.class.organization.name} &middot; {u.class.teacher.name}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[u.status] || "bg-zinc-100 text-zinc-600"}`}
                      >
                        <StatusIcon size={12} />
                        {u.status === "MANUAL_REVIEW" ? "Manual review" : u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Uploaded {new Date(u.createdAt).toLocaleDateString()} &middot; {u.class.teacher.email}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Parsing templates</h2>
          {templates.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <FileCsv size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No templates yet. They are created automatically during upload.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {t.subject}
                        <span className="text-zinc-400 font-normal"> &middot; {t.examBoard}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">ID: {t.organizationId}</p>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">{Math.round(t.confidence * 100)}% confidence</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Model: {t.modelName}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
