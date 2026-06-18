import { NextResponse } from "next/server";
import { readJson } from "@/lib/data";

export async function GET() {
  return NextResponse.json(readJson("monthly_volume.json"));
}
