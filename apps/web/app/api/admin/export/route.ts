import { NextResponse } from "next/server";
import { prisma } from "@bikie/database";
import { requireRole } from "@/lib/require-role";

export async function GET(_request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(_request.url);
  const type = url.searchParams.get("type") ?? "users";

  let rows: Record<string, unknown>[];
  let filename: string;

  switch (type) {
    case "users": {
      const users = await prisma.user.findMany();
      rows = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }));
      filename = "users.csv";
      break;
    }
    case "bookings": {
      const bookings = await prisma.booking.findMany({ include: { user: true, bike: true } });
      rows = bookings.map((b) => ({
        id: b.id,
        user: b.user.email,
        bike: b.bike.name,
        status: b.status,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        totalPrice: Number(b.totalPrice),
        createdAt: b.createdAt.toISOString(),
      }));
      filename = "bookings.csv";
      break;
    }
    case "partners": {
      const partners = await prisma.partner.findMany({ include: { user: true } });
      rows = partners.map((p) => ({
        id: p.id,
        userEmail: p.user.email,
        businessName: p.businessName,
        type: p.type,
        city: p.city,
        isVerified: p.isVerified,
        createdAt: p.createdAt.toISOString(),
      }));
      filename = "partners.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const esc = (v: unknown) => `"${v == null ? "" : String(v).replace(/"/g, '""')}"`;
  const header = Object.keys(rows[0] ?? {}).map(esc).join(",");
  const csvLines = rows.map((r) => Object.values(r).map(esc).join(","));
  const csv = [header, ...csvLines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}