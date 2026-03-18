import { NextResponse } from 'next/server';

export async function POST() {
  // Clear session cookie
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('session', '', { expires: new Date(0) });
  return response;
}
