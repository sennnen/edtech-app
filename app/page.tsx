import Link from "next/link"
import { GraduationCap, ChartBar, Video, Upload } from "@phosphor-icons/react/dist/ssr"

const features = [
  {
    icon: Upload,
    title: "Upload Mock Results",
    desc: "Import CSV spreadsheets of student mock exam data in seconds.",
  },
  {
    icon: ChartBar,
    title: "Auto-Detect Weaknesses",
    desc: "Our engine finds weak topics per student from their results.",
  },
  {
    icon: Video,
    title: "Interactive Video Lessons",
    desc: "Videos pause at key moments to quiz students and reinforce learning.",
  },
]

export default function Home() {
  return (
    <main>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-sm font-medium mb-8">
            <GraduationCap size={16} />
            AI-powered learning platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
            Turn exam results into{" "}
            <span className="text-zinc-400">personalised learning</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Upload mock exam spreadsheets, let AI identify each student&apos;s weak topics,
            and serve targeted interactive video lessons — automatically.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors text-sm"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-8">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-zinc-700" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8">
        <p className="text-center text-sm text-zinc-400">EdTech Platform</p>
      </footer>
    </main>
  )
}
