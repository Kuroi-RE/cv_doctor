import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement admin operations
  return NextResponse.json({ message: "Admin endpoint - not yet implemented" }, { status: 501 });
}
