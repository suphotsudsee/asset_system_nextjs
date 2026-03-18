import { NextRequest } from 'next/server';

export function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }

  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || undefined;
}
