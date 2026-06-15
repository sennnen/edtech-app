import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json([], { status: 401 })
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(classes)
}
