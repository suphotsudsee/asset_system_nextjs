'use client';

import { useMemo, useSyncExternalStore } from 'react';

export const PUBLIC_QR_BASE_URL_STORAGE_KEY = 'public-qr-base-url';
export const PUBLIC_QR_BASE_URL_CHANGE_EVENT = 'public-qr-base-url-change';

export function getPublicQrBaseUrlSnapshot() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(PUBLIC_QR_BASE_URL_STORAGE_KEY) ?? '';
}

export function parsePublicQrBaseUrl(value: string | null | undefined) {
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

export function savePublicQrBaseUrl(value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = parsePublicQrBaseUrl(value);
  window.localStorage.setItem(PUBLIC_QR_BASE_URL_STORAGE_KEY, normalized);
  window.dispatchEvent(new Event(PUBLIC_QR_BASE_URL_CHANGE_EVENT));
}

function subscribePublicQrBaseUrl(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener(PUBLIC_QR_BASE_URL_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(PUBLIC_QR_BASE_URL_CHANGE_EVENT, handleChange);
  };
}

export function usePublicQrBaseUrl() {
  const snapshot = useSyncExternalStore(
    subscribePublicQrBaseUrl,
    getPublicQrBaseUrlSnapshot,
    () => ''
  );

  return useMemo(() => parsePublicQrBaseUrl(snapshot), [snapshot]);
}
