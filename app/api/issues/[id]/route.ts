import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const issueId = resolvedParams.id;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        asset: {
          select: { id: true, name: true, category: true, serialNo: true, status: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ data: issue });
  } catch (error) {
    console.error("GET /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Only IT Admin can update issue status
    if (session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Forbidden - IT Admin only" }, { status: 403 });
    }

    const resolvedParams = await params;
    const issueId = resolvedParams.id;

    const body = await req.json();
    const result = updateIssueSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const updateData: any = {
      status: result.data.status
    };

    // Auto-set resolvedAt if transitioning to RESOLVED
    if (result.data.status === "RESOLVED" && issue.status !== "RESOLVED") {
      updateData.resolvedAt = new Date();
    } else if (result.data.status !== "RESOLVED") {
      updateData.resolvedAt = null; // Clear if moved back to open/in progress
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        asset: { select: { id: true, name: true, serialNo: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({ data: updatedIssue });
  } catch (error) {
    console.error("PUT /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
