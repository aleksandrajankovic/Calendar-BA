export const runtime = "nodejs";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// Samo admin — javni kalendar čita bazu direktno na serveru
export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const rows = await prisma.weeklyPromotion.findMany({
    orderBy: { weekday: "asc" },
  });
  return Response.json(rows);
}
