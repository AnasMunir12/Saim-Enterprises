import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public admin registration does not exist. The super admin is provisioned with scripts/ensure-admin.mjs.
function notFound() {
  return NextResponse.json({ message: "Not found." }, { status: 404 });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
