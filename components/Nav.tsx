"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, Upload, Gauge, SignOut, SignIn } from "@phosphor-icons/react"
import { signOut, useSession } from "next-auth/react"

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const links = session
    ? [
        { href: "/dashboard", label: "Dashboard", icon: Gauge },
        { href: "/uploads", label: "Uploads", icon: Upload },
      ]
    : []

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
            <GraduationCap size={24} weight="fill" className="text-zinc-900" />
            <span className="text-lg">EdTech</span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              )
            })}
            {session ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                <SignOut size={18} />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                <SignIn size={18} />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
