'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useAppLanguage } from '@/lib/language';

interface Stats {
  totalAssets: number;
  activeAssets: number;
  totalValue: number;
  maintenancePending: number;
}

interface UserProfile {
  username: string;
  role: string;
  fullName?: string | null;
}

export default function DashboardPage() {
  const { locale, t } = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [router]);

  const statCards = [
    { title: t('dashboardTotalAssets'), value: numberFormatter.format(stats?.totalAssets ?? 0), icon: '📦', valueClassName: 'text-white' },
    { title: t('dashboardActiveAssets'), value: numberFormatter.format(stats?.activeAssets ?? 0), icon: '✅', valueClassName: 'text-emerald-400' },
    { title: t('dashboardMaintenancePending'), value: numberFormatter.format(stats?.maintenancePending ?? 0), icon: '🔧', valueClassName: 'text-amber-400' },
    { title: t('dashboardTotalValue'), value: `${numberFormatter.format(stats?.totalValue ?? 0)} ฿`, icon: '💰', valueClassName: 'text-indigo-400' },
  ];

  const quickActions = [
    { href: '/assets/add', title: t('dashboardAddAsset'), description: t('dashboardAddAssetDesc'), icon: '✚', accentClassName: 'text-violet-400' },
    { href: '/assets', title: t('dashboardViewAssets'), description: t('dashboardViewAssetsDesc'), icon: '📋', accentClassName: 'text-amber-300' },
    { href: '/qr-scanner', title: t('dashboardScanQr'), description: t('dashboardScanQrDesc'), icon: '📷', accentClassName: 'text-slate-300' },
    { href: '/reports', title: t('dashboardReports'), description: t('dashboardReportsDesc'), icon: '📊', accentClassName: 'text-sky-300' },
  ];

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <h1 className="mb-8 text-5xl font-black tracking-tight text-white">{t('dashboardTitle')}</h1>

          <section className="mb-8 rounded-2xl bg-[#1d1d1d] px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <h2 className="text-2xl font-extrabold text-white">
              {t('dashboardWelcome', { name: user?.fullName || user?.username || t('sidebarSystemAdministrator') })}
            </h2>
            <p className="mt-3 text-lg text-zinc-400">{t('dashboardRole', { role: user?.role || 'admin' })}</p>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-2xl bg-[#1d1d1d]" />
                ))
              : statCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                  >
                    <div className="text-4xl">{card.icon}</div>
                    <p className="mt-5 text-lg font-semibold text-zinc-400">{card.title}</p>
                    <p className={`mt-4 text-5xl font-black tracking-tight ${card.valueClassName}`}>{card.value}</p>
                  </div>
                ))}
          </section>

          <section className="mb-8 rounded-2xl bg-[#1d1d1d] px-8 py-9 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <h2 className="text-3xl font-bold text-white">{t('dashboardQuickActions')}</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-2xl bg-[#2d2d2d] p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-[#343434]"
                >
                  <div className={`text-3xl ${action.accentClassName}`}>{action.icon}</div>
                  <h3 className="mt-4 text-3xl font-bold text-white">{action.title}</h3>
                  <p className="mt-2 text-base text-zinc-400">{action.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border-l-4 border-indigo-500 bg-[#1d1d1d] px-8 py-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-xl text-indigo-300">ℹ️</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{t('dashboardDemoMode')}</h2>
                <p className="mt-2 text-lg text-zinc-400">{t('dashboardDemoDesc')}</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
