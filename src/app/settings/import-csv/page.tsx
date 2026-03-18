'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Toast from '../../../components/Toast';
import { useAppLanguage } from '@/lib/language';

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

export default function ImportCsvPage() {
  const { language } = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const copy = useMemo(
    () =>
      language === 'th'
        ? {
            title: 'นำเข้า CSV',
            subtitle: 'อัปโหลดไฟล์ CSV จาก GLPI เพื่อนำข้อมูลครุภัณฑ์เข้าระบบ',
            chooseFile: 'เลือกไฟล์ CSV',
            noFile: 'ยังไม่ได้เลือกไฟล์',
            importButton: 'เริ่มนำเข้าข้อมูล',
            importing: 'กำลังนำเข้า...',
            cardTitle: 'รองรับไฟล์ GLPI CSV',
            cardText: 'ระบบจะสร้างหมวดหมู่และหน่วยงานที่ยังไม่มีให้อัตโนมัติ และ update ข้อมูลเดิมถ้าพบรหัส asset เดิม',
            resultTitle: 'ผลการนำเข้า',
            total: 'ทั้งหมด',
            created: 'สร้างใหม่',
            updated: 'อัปเดต',
            skipped: 'ข้าม',
            fileRequired: 'กรุณาเลือกไฟล์ CSV ก่อน',
            importSuccess: 'นำเข้าข้อมูลสำเร็จ',
            importFailed: 'นำเข้าข้อมูลไม่สำเร็จ',
          }
        : {
            title: 'Import CSV',
            subtitle: 'Upload a GLPI CSV file to import asset data into this system',
            chooseFile: 'Choose CSV File',
            noFile: 'No file selected',
            importButton: 'Start Import',
            importing: 'Importing...',
            cardTitle: 'GLPI CSV Supported',
            cardText: 'The system will automatically create missing categories and departments, and update existing assets when the same asset code is found.',
            resultTitle: 'Import Result',
            total: 'Total',
            created: 'Created',
            updated: 'Updated',
            skipped: 'Skipped',
            fileRequired: 'Please choose a CSV file first',
            importSuccess: 'Import completed successfully',
            importFailed: 'Import failed',
          },
    [language]
  );

  const handleSubmit = async () => {
    if (!file) {
      setToast({ message: copy.fileRequired, type: 'info' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/glpi', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || copy.importFailed, type: 'error' });
        return;
      }

      setResult(data);
      setToast({ message: copy.importSuccess, type: 'success' });
    } catch {
      setToast({ message: copy.importFailed, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8">
            <h1 className="text-5xl font-black tracking-tight">{copy.title}</h1>
            <p className="mt-3 text-lg text-zinc-400">{copy.subtitle}</p>
          </div>

          <section className="mb-8 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <h2 className="text-2xl font-bold text-white">{copy.cardTitle}</h2>
            <p className="mt-3 text-zinc-400">{copy.cardText}</p>

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#2d2d2d] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#383838]">
                {copy.chooseFile}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="text-zinc-400">{file ? file.name : copy.noFile}</div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? copy.importing : copy.importButton}
              </button>
            </div>
          </section>

          {result && (
            <section className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <h2 className="text-2xl font-bold text-white">{copy.resultTitle}</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-[#252525] p-4">
                  <p className="text-sm text-zinc-400">{copy.total}</p>
                  <p className="mt-2 text-3xl font-black text-white">{result.total}</p>
                </div>
                <div className="rounded-xl bg-[#252525] p-4">
                  <p className="text-sm text-zinc-400">{copy.created}</p>
                  <p className="mt-2 text-3xl font-black text-emerald-400">{result.created}</p>
                </div>
                <div className="rounded-xl bg-[#252525] p-4">
                  <p className="text-sm text-zinc-400">{copy.updated}</p>
                  <p className="mt-2 text-3xl font-black text-indigo-400">{result.updated}</p>
                </div>
                <div className="rounded-xl bg-[#252525] p-4">
                  <p className="text-sm text-zinc-400">{copy.skipped}</p>
                  <p className="mt-2 text-3xl font-black text-amber-400">{result.skipped}</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
