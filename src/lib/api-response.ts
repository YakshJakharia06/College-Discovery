import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(code: string, message: string, status = 400) {
  // Never include stack traces or raw database errors here — this is the
  // single choke point for all error responses, so keeping it to a stable
  // { code, message } shape is what keeps internals out of client responses.
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
