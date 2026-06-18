import { NextResponse } from "next/server";
import { readJson } from "@/lib/data";

export async function GET() {
  const data = readJson("kpis.json");
  return NextResponse.json(data);
}
