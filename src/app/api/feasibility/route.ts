import { NextResponse } from "next/server";
import { readJson } from "@/lib/data";

export async function GET() {
  return NextResponse.json(readJson("feasibility_by_company.json"));
}
