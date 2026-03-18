'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';

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
  };
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

const methodLabels: Record<string, string> = {
  straight_line: 'straight-line',
  declining_balance: 'declining',
};

export default function DepreciationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void fetchDepreciations();
  }, [fetchDepreciations, router]);

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
    if (!methodFilter) return depreciations;
    return depreciations.filter((dep) => dep.depreciationMethod === methodFilter);
  }, [depreciations, methodFilter]);

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

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="text-6xl">📈</div>
            <h1 className="text-5xl font-black tracking-tight text-white">Depreciation Management</h1>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Total Original Value</p>
              <p className="mt-4 text-4xl font-black text-indigo-400">{currencyFormatter.format(summary.totalOriginalValue)} ฿</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Accumulated Depreciation</p>
              <p className="mt-4 text-4xl font-black text-amber-400">{currencyFormatter.format(summary.accumulatedDepreciation)} ฿</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Net Book Value</p>
              <p className="mt-4 text-4xl font-black text-emerald-400">{currencyFormatter.format(summary.netBookValue)} ฿</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Total Assets</p>
              <p className="mt-4 text-4xl font-black text-white">{summary.totalAssets}</p>
            </div>
          </section>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="text-2xl text-zinc-400">Filter by Method:</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
              >
                <option value="">All Methods</option>
                <option value="straight_line">Straight-Line</option>
                <option value="declining_balance">Declining Balance</option>
              </select>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#1d1d1d] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#2d2d2d] text-left">
                  <tr className="text-lg text-zinc-400">
                    <th className="px-4 py-5 font-semibold">Asset Code</th>
                    <th className="px-4 py-5 font-semibold">Asset Name</th>
                    <th className="px-4 py-5 font-semibold">Method</th>
                    <th className="px-4 py-5 text-right font-semibold">Original Value</th>
                    <th className="px-4 py-5 text-right font-semibold">Accumulated</th>
                    <th className="px-4 py-5 text-right font-semibold">Net Book Value</th>
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
                        ไม่พบข้อมูลค่าเสื่อมราคา
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
                          <td className="px-4 py-6 text-right align-middle">{currencyFormatter.format(dep.beginningBookValue)} ฿</td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-amber-400">
                            {currencyFormatter.format(dep.accumulatedDepreciation)} ฿
                          </td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-emerald-400">
                            {currencyFormatter.format(dep.endingBookValue)} ฿
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
              <span className="mt-1 text-xl text-amber-300">💡</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Depreciation Methods</h2>
                <p className="mt-3 text-lg text-zinc-400">
                  <span className="font-semibold text-zinc-300">Straight-Line:</span> Equal depreciation each year (recommended for government assets)
                </p>
                <p className="mt-1 text-lg text-zinc-400">
                  <span className="font-semibold text-zinc-300">Declining Balance:</span> Higher depreciation in early years
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Depreciation Schedule"
        footer={
          <button
            type="button"
            onClick={() => setScheduleModalOpen(false)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
          >
            Close
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">Year</th>
                <th className="px-4 py-2 text-right text-gray-300">Depreciation</th>
                <th className="px-4 py-2 text-right text-gray-300">Accumulated</th>
                <th className="px-4 py-2 text-right text-gray-300">Net Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {schedule.map((row, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="px-4 py-2 text-white">{row.year}</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.depreciationExpense)} ฿</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.accumulatedDepreciation)} ฿</td>
                  <td className="px-4 py-2 text-right text-white">{currencyFormatter.format(row.endingBookValue)} ฿</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
