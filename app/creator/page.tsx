import { requireCreator } from "@/lib/guard"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Video, Plus } from "@phosphor-icons/react/dist/ssr"

export default async function CreatorPage() {
  const session = await requireCreator()

  const videos = await prisma.video.findMany({
    where: { creatorId: session.user.id },
    include: {
      _count: { select: { cuePoints: true } },
      primaryTopic: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Creator Dashboard</h1>
          <p className="text-zinc-500 mt-1">Manage your video content and cue points.</p>
        </div>
        <Link
          href="/creator/videos/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={18} />
          New video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl">
          <Video size={40} className="text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No videos yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Create your first interactive video with cue points.
          </p>
          <Link
            href="/creator/videos/new"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} />
            Add video
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="font-medium text-zinc-900 text-sm">{v.title}</h3>
              {v.primaryTopic && (
                <p className="text-xs text-zinc-400 mt-1">{v.primaryTopic.title}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                <span>{v._count.cuePoints} cue points</span>
                {v.muxPlaybackId && <span className="text-emerald-600">Live</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
