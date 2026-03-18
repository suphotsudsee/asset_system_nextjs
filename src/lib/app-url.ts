import { NextRequest } from 'next/server';

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'http');

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }

  return `${protocol}://${host}`;
}

export function getAssetQrUrl(request: NextRequest, assetId: number) {
  return `${getRequestOrigin(request)}/qr/${assetId}`;
}
