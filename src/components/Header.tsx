'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAppLanguage } from '@/lib/language';

const FONT_SCALE_STORAGE_KEY = 'app-font-scale';
const MIN_FONT_SCALE = 85;
const MAX_FONT_SCALE = 130;
const FONT_SCALE_STEP = 5;

function clampFontScale(value: number) {
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
}

function applyFontScale(value: number) {
  document.documentElement.style.fontSize = `${value}%`;
}

function getFontScaleSnapshot() {
  if (typeof window === 'undefined') {
    return '100';
  }

  return window.localStorage.getItem(FONT_SCALE_STORAGE_KEY) ?? '100';
}

function subscribeFontScale(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('app-font-scale-change', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('app-font-scale-change', handleChange);
  };
}

export default function Header() {
  const { t } = useAppLanguage();
  const fontScaleSnapshot = useSyncExternalStore(subscribeFontScale, getFontScaleSnapshot, () => '100');
  const fontScale = clampFontScale(Number(fontScaleSnapshot) || 100);

  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);

  const updateFontScale = (nextValue: number) => {
    const nextScale = clampFontScale(nextValue);
    window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(nextScale));
    window.dispatchEvent(new Event('app-font-scale-change'));
  };

  return (
    <header className="border-b border-white/5 bg-[#252525]">
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1d1d1d] text-xl text-zinc-300 transition-colors hover:text-white lg:hidden"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateFontScale(fontScale - FONT_SCALE_STEP)}
            disabled={fontScale <= MIN_FONT_SCALE}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1d1d1d] px-3 text-sm font-bold text-zinc-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('headerDecreaseFont')}
            title={t('headerDecreaseFont')}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => updateFontScale(fontScale + FONT_SCALE_STEP)}
            disabled={fontScale >= MAX_FONT_SCALE}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1d1d1d] px-3 text-sm font-bold text-zinc-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('headerIncreaseFont')}
            title={t('headerIncreaseFont')}
          >
            A+
          </button>
        </div>
      </div>
    </header>
  );
}
