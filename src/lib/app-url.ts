import { NextRequest } from 'next/server';

function parseServerQrBaseUrl(value: string | null | undefined) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.origin.replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'http');

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9015';
  }

  return `${protocol}://${host}`;
}

export function getAssetQrUrl(request: NextRequest, assetId: number) {
  const configuredBaseUrl = parseServerQrBaseUrl(
    request.nextUrl.searchParams.get('baseUrl') || process.env.NEXT_PUBLIC_APP_URL
  );
  const baseUrl = configuredBaseUrl || getRequestOrigin(request);
  return `${baseUrl}/qr/${assetId}`;
}
