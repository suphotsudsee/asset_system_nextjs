'use client';

export default function Header() {
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
      </div>
    </header>
  );
}
