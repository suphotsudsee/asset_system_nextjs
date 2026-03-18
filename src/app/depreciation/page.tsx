'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { useAppLanguage } from '@/lib/language';

interface Depreciation {
  id: number;
  assetId: number;
  fiscalYear: number;
  fiscalPeriod: string;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
  depreciationMethod: string;
  asset?: {
    assetCode: string;
    name: string;
    department?: string | null;
    category?: string | null;
  };
}

interface Category {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface ScheduleRow {
  year: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

interface ScheduleAssetInfo {
  assetCode: string;
  name: string;
}

const currencyFormatter = new Intl.NumberFormat('th-TH');

const methodStyles: Record<string, string> = {
  straight_line: 'bg-emerald-950 text-emerald-400',
  declining_balance: 'bg-amber-950 text-amber-400',
};

export default function DepreciationPage() {
  const { language } = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<ScheduleAssetInfo | null>(null);
  const router = useRouter();

  const fetchDepreciations = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      });
      const res = await fetch(`/api/depreciation?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      setDepreciations(data.depreciations ?? []);
    } catch {
      console.error('Failed to fetch depreciations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [categoriesRes, departmentsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/departments'),
      ]);

      if (categoriesRes.ok) {
        const categoriesData: Category[] = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (departmentsRes.ok) {
        const departmentsData: Department[] = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch {
      console.error('Failed to fetch depreciation filters');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void Promise.all([fetchDepreciations(), fetchFilterOptions()]);
  }, [fetchDepreciations, fetchFilterOptions, router]);

  const fetchSchedule = async (assetId: number) => {
    try {
      const res = await fetch(`/api/depreciation/${assetId}/schedule`);
      if (!res.ok) return;

      const data = await res.json();
      setSchedule(data.schedule || []);
      setSelectedAssetInfo(data.asset || null);
      setScheduleModalOpen(true);
    } catch {
      console.error('Failed to fetch schedule');
    }
  };

  const filteredDepreciations = useMemo(() => {
    return depreciations.filter((dep) => {
      if (methodFilter && dep.depreciationMethod !== methodFilter) {
        return false;
      }

      if (departmentFilter && dep.asset?.department !== departmentFilter) {
        return false;
      }

      if (categoryFilter && dep.asset?.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, departmentFilter, depreciations, methodFilter]);

  const summary = useMemo(() => {
    return filteredDepreciations.reduce(
      (acc, dep) => {
        acc.totalOriginalValue += dep.beginningBookValue;
        acc.accumulatedDepreciation += dep.accumulatedDepreciation;
        acc.netBookValue += dep.endingBookValue;
        acc.totalAssets += 1;
        return acc;
      },
      {
        totalOriginalValue: 0,
        accumulatedDepreciation: 0,
        netBookValue: 0,
        totalAssets: 0,
      }
    );
  }, [filteredDepreciations]);

  const methodLabels = useMemo(
    () => ({
      straight_line: language === 'th' ? 'เส้นตรง' : 'Straight-Line',
      declining_balance: language === 'th' ? 'ยอดลดลง' : 'Declining Balance',
    }),
    [language]
  );

  const currencyUnit = language === 'th' ? 'บาท' : 'THB';
  const pageTitle = language === 'th' ? 'จัดการค่าเสื่อมราคา' : 'Depreciation Management';
  const summaryLabels = {
    totalOriginalValue: language === 'th' ? 'มูลค่าเริ่มต้นรวม' : 'Total Original Value',
    accumulatedDepreciation: language === 'th' ? 'ค่าเสื่อมสะสม' : 'Accumulated Depreciation',
    netBookValue: language === 'th' ? 'มูลค่าคงเหลือสุทธิ' : 'Net Book Value',
    totalAssets: language === 'th' ? 'จำนวนครุภัณฑ์' : 'Total Assets',
  };
  const tableLabels = {
    assetCode: language === 'th' ? 'รหัสครุภัณฑ์' : 'Asset Code',
    assetName: language === 'th' ? 'ชื่อครุภัณฑ์' : 'Asset Name',
    method: language === 'th' ? 'วิธีคิด' : 'Method',
    originalValue: language === 'th' ? 'มูลค่าเริ่มต้น' : 'Original Value',
    accumulated: language === 'th' ? 'ค่าเสื่อมสะสม' : 'Accumulated',
    netBookValue: language === 'th' ? 'มูลค่าคงเหลือสุทธิ' : 'Net Book Value',
  };
  const methodsInfo = {
    title: language === 'th' ? 'วิธีคิดค่าเสื่อมราคา' : 'Depreciation Methods',
    straight: language === 'th'
      ? 'เส้นตรง: ค่าเสื่อมเท่ากันทุกปี เหมาะกับครุภัณฑ์ราชการทั่วไป'
      : 'Straight-Line: Equal depreciation each year (recommended for government assets)',
    declining: language === 'th'
      ? 'ยอดลดลง: ค่าเสื่อมสูงในช่วงปีแรก ๆ'
      : 'Declining Balance: Higher depreciation in early years',
  };
  const modalLabels = {
    title: language === 'th' ? 'ตารางค่าเสื่อมราคา' : 'Depreciation Schedule',
    close: language === 'th' ? 'ปิด' : 'Close',
    year: language === 'th' ? 'ปี' : 'Year',
    depreciation: language === 'th' ? 'ค่าเสื่อม' : 'Depreciation',
    accumulated: language === 'th' ? 'ค่าเสื่อมสะสม' : 'Accumulated',
    netBookValue: language === 'th' ? 'มูลค่าคงเหลือสุทธิ' : 'Net Book Value',
  };

  const scheduleChart = useMemo(() => {
    if (schedule.length === 0) return null;

    const width = 760;
    const height = 260;
    const padding = 32;
    const maxValue = Math.max(
      ...schedule.flatMap((row) => [
        row.depreciationExpense,
        row.accumulatedDepreciation,
        row.endingBookValue,
      ]),
      1
    );

    const getX = (index: number) => {
      if (schedule.length === 1) return width / 2;
      return padding + (index * (width - padding * 2)) / (schedule.length - 1);
    };

    const getY = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);

    const toPath = (values: number[]) =>
      values
        .map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index).toFixed(2)} ${getY(value).toFixed(2)}`)
        .join(' ');

    return {
      width,
      height,
      maxValue,
      depreciationPath: toPath(schedule.map((row) => row.depreciationExpense)),
      accumulatedPath: toPath(schedule.map((row) => row.accumulatedDepreciation)),
      bookValuePath: toPath(schedule.map((row) => row.endingBookValue)),
      points: schedule.map((row, index) => ({
        year: row.year,
        x: getX(index),
        depreciationY: getY(row.depreciationExpense),
        accumulatedY: getY(row.accumulatedDepreciation),
        bookValueY: getY(row.endingBookValue),
      })),
    };
  }, [schedule]);

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1d1d1d] text-indigo-400">
              <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 17l4-5 3 3 5-7" />
                <circle cx="6" cy="17" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="10" cy="12" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="13" cy="15" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="18" cy="8" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white">{pageTitle}</h1>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">{summaryLabels.totalOriginalValue}</p>
              <p className="mt-4 text-4xl font-black text-indigo-400">{currencyFormatter.format(summary.totalOriginalValue)} {currencyUnit}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">{summaryLabels.accumulatedDepreciation}</p>
              <p className="mt-4 text-4xl font-black text-amber-400">{currencyFormatter.format(summary.accumulatedDepreciation)} {currencyUnit}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">{summaryLabels.netBookValue}</p>
              <p className="mt-4 text-4xl font-black text-emerald-400">{currencyFormatter.format(summary.netBookValue)} {currencyUnit}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">{summaryLabels.totalAssets}</p>
              <p className="mt-4 text-4xl font-black text-white">{summary.totalAssets}</p>
            </div>
          </section>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">
                  {language === 'th' ? 'กรองตามวิธีคิดค่าเสื่อม' : 'Filter by Method'}
                </label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทุกวิธี' : 'All Methods'}</option>
                  <option value="straight_line">{methodLabels.straight_line}</option>
                  <option value="declining_balance">{methodLabels.declining_balance}</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">
                  {language === 'th' ? 'หน่วยงาน' : 'Department'}
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทุกหน่วยงาน' : 'All Departments'}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">
                  {language === 'th' ? 'หมวดหมู่' : 'Category'}
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทุกหมวดหมู่' : 'All Categories'}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#1d1d1d] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#2d2d2d] text-left">
                  <tr className="text-lg text-zinc-400">
                    <th className="px-4 py-5 font-semibold">{tableLabels.assetCode}</th>
                    <th className="px-4 py-5 font-semibold">{tableLabels.assetName}</th>
                    <th className="px-4 py-5 font-semibold">{tableLabels.method}</th>
                    <th className="px-4 py-5 text-right font-semibold">{tableLabels.originalValue}</th>
                    <th className="px-4 py-5 text-right font-semibold">{tableLabels.accumulated}</th>
                    <th className="px-4 py-5 text-right font-semibold">{tableLabels.netBookValue}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-t border-white/5">
                        <td className="px-4 py-6" colSpan={6}>
                          <div className="h-8 animate-pulse rounded bg-[#2a2a2a]" />
                        </td>
                      </tr>
                    ))
                  ) : filteredDepreciations.length === 0 ? (
                    <tr className="border-t border-white/5">
                      <td colSpan={6} className="px-4 py-14 text-center text-lg text-zinc-500">
                        {language === 'th' ? 'ไม่พบข้อมูลค่าเสื่อมราคา' : 'No depreciation data found'}
                      </td>
                    </tr>
                  ) : (
                    filteredDepreciations.map((dep) => {
                      const methodClass = methodStyles[dep.depreciationMethod] ?? 'bg-zinc-800 text-zinc-300';
                      const methodLabel = methodLabels[dep.depreciationMethod] ?? dep.depreciationMethod;

                      return (
                        <tr
                          key={dep.id}
                          className="cursor-pointer border-t border-white/5 text-lg text-white transition-colors hover:bg-[#222222]"
                          onClick={() => void fetchSchedule(dep.assetId)}
                        >
                          <td className="px-4 py-6 align-middle font-medium text-indigo-400">{dep.asset?.assetCode || '-'}</td>
                          <td className="px-4 py-6 align-middle font-semibold text-white">{dep.asset?.name || '-'}</td>
                          <td className="px-4 py-6 align-middle">
                            <span className={`inline-flex rounded-md px-4 py-1 text-sm font-bold ${methodClass}`}>{methodLabel}</span>
                          </td>
                          <td className="px-4 py-6 text-right align-middle">{currencyFormatter.format(dep.beginningBookValue)} {currencyUnit}</td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-amber-400">
                            {currencyFormatter.format(dep.accumulatedDepreciation)} {currencyUnit}
                          </td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-emerald-400">
                            {currencyFormatter.format(dep.endingBookValue)} {currencyUnit}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border-l-4 border-indigo-500 bg-[#1d1d1d] px-8 py-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">i</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{methodsInfo.title}</h2>
                <p className="mt-3 text-lg text-zinc-400">
                  {methodsInfo.straight}
                </p>
                <p className="mt-1 text-lg text-zinc-400">
                  {methodsInfo.declining}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={modalLabels.title}
        footer={
          <button
            type="button"
            onClick={() => setScheduleModalOpen(false)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
          >
            {modalLabels.close}
          </button>
        }
      >
        <div className="mb-4">
          {selectedAssetInfo && (
            <p className="text-gray-400">
              {selectedAssetInfo.assetCode} - {selectedAssetInfo.name}
            </p>
          )}
        </div>

        {scheduleChart && (
          <div className="mb-6 rounded-xl border border-gray-700 bg-[#1f2937] p-4">
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-blue-300">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                {language === 'th' ? 'ค่าเสื่อมต่อปี' : 'Depreciation'}
              </span>
              <span className="inline-flex items-center gap-2 text-amber-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                {language === 'th' ? 'ค่าเสื่อมสะสม' : 'Accumulated'}
              </span>
              <span className="inline-flex items-center gap-2 text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {language === 'th' ? 'มูลค่าคงเหลือสุทธิ' : 'Net Book Value'}
              </span>
            </div>

            <svg viewBox={`0 0 ${scheduleChart.width} ${scheduleChart.height}`} className="w-full overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = scheduleChart.height - 32 - tick * (scheduleChart.height - 64);
                const label = Math.round(scheduleChart.maxValue * tick);

                return (
                  <g key={tick}>
                    <line x1="32" y1={y} x2={scheduleChart.width - 32} y2={y} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
                    <text x="8" y={y + 4} fill="#94a3b8" fontSize="12">
                      {currencyFormatter.format(label)}
                    </text>
                  </g>
                );
              })}

              <path d={scheduleChart.depreciationPath} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
              <path d={scheduleChart.accumulatedPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              <path d={scheduleChart.bookValuePath} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />

              {scheduleChart.points.map((point) => (
                <g key={point.year}>
                  <circle cx={point.x} cy={point.depreciationY} r="4" fill="#60a5fa" />
                  <circle cx={point.x} cy={point.accumulatedY} r="4" fill="#f59e0b" />
                  <circle cx={point.x} cy={point.bookValueY} r="4" fill="#34d399" />
                  <text x={point.x} y={scheduleChart.height - 8} textAnchor="middle" fill="#94a3b8" fontSize="12">
                    {point.year}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">{modalLabels.year}</th>
                <th className="px-4 py-2 text-right text-gray-300">{modalLabels.depreciation}</th>
                <th className="px-4 py-2 text-right text-gray-300">{modalLabels.accumulated}</th>
                <th className="px-4 py-2 text-right text-gray-300">{modalLabels.netBookValue}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {schedule.map((row, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="px-4 py-2 text-white">{row.year}</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.depreciationExpense)} {currencyUnit}</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.accumulatedDepreciation)} {currencyUnit}</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.endingBookValue)} {currencyUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

