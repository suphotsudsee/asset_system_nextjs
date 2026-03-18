'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  username: string;
  role: string;
  fullName?: string | null;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/assets', label: 'Assets', icon: '📦' },
  { href: '/depreciation', label: 'Depreciation', icon: '📝' },
  { href: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { href: '/qr-scanner', label: 'QR Scanner', icon: '📷' },
  { href: '/reports', label: 'Reports', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(isOpen);
  const userSnapshot = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem('user'),
    () => null
  );
  const user = useMemo<UserProfile | null>(() => {
    if (!userSnapshot) return null;

    try {
      return JSON.parse(userSnapshot) as UserProfile;
    } catch {
      return null;
    }
  }, [userSnapshot]);

  useEffect(() => {
    setSidebarVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = () => {
      setSidebarVisible((current) => !current);
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
    };
  }, []);

  const handleClose = () => {
    setSidebarVisible(false);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout API errors and clear local session anyway.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <>
      {sidebarVisible && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1d1d1d] text-white transition-transform duration-300 ${
          sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-white/5 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl text-indigo-200">🏛️</span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-indigo-400">Asset Mgmt</h1>
              <p className="mt-1 text-sm text-zinc-400">ระบบงานทะเบียนครุภัณฑ์</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 text-lg transition-colors ${
                  active ? 'bg-[#2d2d2d] font-semibold text-indigo-400' : 'text-zinc-400 hover:bg-[#262626] hover:text-white'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-5">
          <div className="rounded-xl bg-[#1f1f1f] px-4 py-4">
            <p className="text-lg font-bold text-white">{user?.fullName || 'System Administrator'}</p>
            <p className="mt-1 text-sm text-zinc-400">{user?.role || 'admin'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-white/10 px-4 py-3 text-base font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
