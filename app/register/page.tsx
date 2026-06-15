"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GraduationCap, Eye, EyeClosed } from "@phosphor-icons/react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    router.push("/login")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 mb-4">
            <GraduationCap size={24} weight="fill" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">Get started with EdTech</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Role</label>
            <div className="flex gap-3">
              {(["STUDENT", "TEACHER"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    role === r
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
