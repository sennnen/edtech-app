"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GraduationCap } from "@phosphor-icons/react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 mb-4">
            <GraduationCap size={24} weight="fill" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-zinc-900 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
