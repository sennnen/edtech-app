import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  if (!allowedRoles.includes(session.user.role)) redirect("/")
  return session
}

export async function requireStudent() {
  return requireRole(["STUDENT"])
}

export async function requireTeacher() {
  return requireRole(["TEACHER", "ADMIN"])
}

export async function requireAdmin() {
  return requireRole(["ADMIN"])
}

export async function requireCreator() {
  return requireRole(["CREATOR", "ADMIN"])
}
