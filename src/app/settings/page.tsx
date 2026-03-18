'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Toast from '../../components/Toast';
import { defaultBranding, getBrandingSnapshot, parseBranding, saveBranding } from '@/lib/branding';
import { AppLanguage, useAppLanguage } from '@/lib/language';
import { getPublicQrBaseUrlSnapshot, parsePublicQrBaseUrl, savePublicQrBaseUrl } from '@/lib/public-qr-base-url';

export default function SettingsPage() {
  const { language, setLanguage, t } = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandTitle, setBrandTitle] = useState(() => parseBranding(getBrandingSnapshot()).title);
  const [brandSubtitle, setBrandSubtitle] = useState(() => parseBranding(getBrandingSnapshot()).subtitle);
  const [publicQrBaseUrl, setPublicQrBaseUrl] = useState(() => parsePublicQrBaseUrl(getPublicQrBaseUrlSnapshot()));
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(language);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const menuItems = [
    {
      id: 'departments',
      title: t('settingsDepartments'),
      description: t('settingsDepartmentsDesc'),
      icon: '๐ข',
      href: '/settings/departments',
    },
    {
      id: 'categories',
      title: t('settingsCategories'),
      description: t('settingsCategoriesDesc'),
      icon: '๐“ฆ',
      href: '/settings/categories',
    },
    {
      id: 'users',
      title: t('settingsUsers'),
      description: t('settingsUsersDesc'),
      icon: '๐‘ค',
      href: '/settings/users',
    },
    {
      id: 'import-csv',
      title: language === 'th' ? 'เธเธณเน€เธเนเธฒ CSV' : 'Import CSV',
      description:
        language === 'th'
          ? 'เธญเธฑเธเนเธซเธฅเธ”เนเธเธฅเน GLPI CSV เน€เธเธทเนเธญเธเธณเน€เธเนเธฒเธเธฃเธธเธ เธฑเธ“เธ‘เนเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ'
          : 'Upload a GLPI CSV file to import assets into the system',
      icon: '๐“ฅ',
      href: '/settings/import-csv',
    },
  ];

  const handleBrandingSave = () => {
    const title = brandTitle.trim();
    const subtitle = brandSubtitle.trim();

    if (!title || !subtitle) {
      setToast({ message: t('settingsFillBranding'), type: 'error' });
      return;
    }

    saveBranding({ title, subtitle });
    setToast({ message: t('settingsSavedBranding'), type: 'success' });
  };

  const handleLanguageSave = () => {
    setLanguage(selectedLanguage);
    setToast({ message: selectedLanguage === 'th' ? 'เธเธฑเธเธ—เธถเธเธ เธฒเธฉเธฒเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง' : 'Language saved successfully', type: 'success' });
  };
  const handlePublicQrBaseUrlSave = () => {
    const normalized = parsePublicQrBaseUrl(publicQrBaseUrl);

    if (publicQrBaseUrl.trim() && !normalized) {
      setToast({
        message: language === 'th' ? 'กรุณากรอก Public QR Base URL ให้ถูกต้อง' : 'Please enter a valid Public QR Base URL',
        type: 'error',
      });
      return;
    }

    savePublicQrBaseUrl(publicQrBaseUrl);
    setPublicQrBaseUrl(normalized);
    setToast({
      message: language === 'th' ? 'บันทึก Public QR Base URL เรียบร้อยแล้ว' : 'Public QR Base URL saved successfully',
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="p-6">
          <h1 className="mb-6 text-3xl font-bold text-white">{t('settingsTitle')}</h1>

          <div className="mb-8 rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">{t('settingsBranding')}</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">{t('settingsSystemName')}</label>
                <input
                  type="text"
                  value={brandTitle}
                  onChange={(e) => setBrandTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Asset Mgmt"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">{t('settingsSystemSubtitle')}</label>
                <input
                  type="text"
                  value={brandSubtitle}
                  onChange={(e) => setBrandSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="System subtitle"
                />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="text-sm text-gray-400">{t('settingsPreview')}</p>
              <p className="mt-2 text-2xl font-black text-indigo-400">{brandTitle || defaultBranding.title}</p>
              <p className="mt-1 text-sm text-gray-400">{brandSubtitle || defaultBranding.subtitle}</p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleBrandingSave}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                {t('settingsSaveBranding')}
              </button>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">{t('settingsLanguage')}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">{t('settingsLanguageLabel')}</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as AppLanguage)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="th">{t('settingsThai')}</option>
                  <option value="en">{t('settingsEnglish')}</option>
                </select>
                <p className="mt-2 text-sm text-gray-400">{t('settingsLanguageHint')}</p>
              </div>

              <button
                type="button"
                onClick={handleLanguageSave}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                {t('settingsSaveLanguage')}
              </button>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">Public QR Base URL</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  {language === 'th' ? 'URL กลางสำหรับ QR ใน production' : 'Stable production URL for QR codes'}
                </label>
                <input
                  type="url"
                  value={publicQrBaseUrl}
                  onChange={(e) => setPublicQrBaseUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="https://asset.company.com"
                />
                <p className="mt-2 text-sm text-gray-400">
                  {language === 'th'
                    ? 'ตั้งค่า domain กลางที่ใช้สร้าง OPEN_URL ใน QR เพื่อลดการพิมพ์ใหม่เมื่อย้ายเครื่องหรือเปลี่ยน deploy URL'
                    : 'Set a stable domain for OPEN_URL in QR payloads so you do not need to reprint when deployment URLs change.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublicQrBaseUrlSave}
                className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
              >
                {language === 'th' ? 'บันทึก URL' : 'Save URL'}
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
                  {t('settingsManage')}
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-white">{t('settingsSystemInfo')}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">{t('settingsVersion')}</p>
                <p className="text-white">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-400">{t('settingsDatabase')}</p>
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

