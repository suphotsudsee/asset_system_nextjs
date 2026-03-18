'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Toast from '../../components/Toast';
import { defaultBranding, getBrandingSnapshot, parseBranding, saveBranding } from '@/lib/branding';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandTitle, setBrandTitle] = useState(() => parseBranding(getBrandingSnapshot()).title);
  const [brandSubtitle, setBrandSubtitle] = useState(() => parseBranding(getBrandingSnapshot()).subtitle);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
  }, [router]);

  const menuItems = [
    {
      id: 'departments',
      title: 'หน่วยงาน',
      description: 'จัดการหน่วยงานและโครงสร้างภายใน',
      icon: '🏢',
      href: '/settings/departments',
    },
    {
      id: 'categories',
      title: 'หมวดหมู่ครุภัณฑ์',
      description: 'จัดการประเภทและหมวดหมู่ของครุภัณฑ์',
      icon: '📦',
      href: '/settings/categories',
    },
    {
      id: 'users',
      title: 'ผู้ใช้งาน',
      description: 'จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ',
      icon: '👤',
      href: '/settings/users',
    },
  ];

  const handleBrandingSave = () => {
    const title = brandTitle.trim();
    const subtitle = brandSubtitle.trim();

    if (!title || !subtitle) {
      setToast({ message: 'กรุณากรอกชื่อระบบและคำอธิบายให้ครบ', type: 'error' });
      return;
    }

    saveBranding({ title, subtitle });
    setToast({ message: 'บันทึก Branding เรียบร้อยแล้ว', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="p-6">
          <h1 className="mb-6 text-3xl font-bold text-white">Settings</h1>

          <div className="mb-8 rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">Branding</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">ชื่อระบบด้านบน</label>
                <input
                  type="text"
                  value={brandTitle}
                  onChange={(e) => setBrandTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="เช่น Asset Mgmt"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">คำอธิบายใต้ชื่อระบบ</label>
                <input
                  type="text"
                  value={brandSubtitle}
                  onChange={(e) => setBrandSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="เช่น ระบบงานทะเบียนครุภัณฑ์"
                />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="text-sm text-gray-400">Preview</p>
              <p className="mt-2 text-2xl font-black text-indigo-400">{brandTitle || defaultBranding.title}</p>
              <p className="mt-1 text-sm text-gray-400">{brandSubtitle || defaultBranding.subtitle}</p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleBrandingSave}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                บันทึก Branding
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-lg bg-gray-800 p-6 shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-white">{item.title}</h3>
                <p className="mb-4 text-gray-400">{item.description}</p>
                <span className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                  จัดการ
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">System Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Version</p>
                <p className="text-white">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-400">Database</p>
                <p className="text-white">MySQL (localhost:3333)</p>
              </div>
              <div>
                <p className="text-gray-400">Prisma ORM</p>
                <p className="text-white">6.19.2</p>
              </div>
              <div>
                <p className="text-gray-400">Next.js</p>
                <p className="text-white">15+</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
