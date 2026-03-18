'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Toast from '../../components/Toast';

interface SummaryAssetRow {
  assetCode: string;
  name: string;
  status: string;
  purchasePrice: number;
  category: string;
}

interface CategoryRow {
  category: string;
  count: number;
}

interface DepartmentRow {
  department: string;
  count: number;
  totalValue: number;
}

interface StatusRow {
  status: string;
  count: number;
}

interface DepreciationRow {
  fiscalYear: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  assetCode: string;
  assetName: string;
}

type TabKey = 'summary' | 'category' | 'department' | 'status' | 'depreciation';

const currencyFormatter = new Intl.NumberFormat('th-TH');

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'summary', label: 'Summary', icon: '📊' },
  { key: 'category', label: 'By Category', icon: '📦' },
  { key: 'department', label: 'By Department', icon: '🏢' },
  { key: 'status', label: 'By Status', icon: '✅' },
  { key: 'depreciation', label: 'Depreciation', icon: '📈' },
];

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [summaryRows, setSummaryRows] = useState<SummaryAssetRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [departmentRows, setDepartmentRows] = useState<DepartmentRow[]>([]);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [depreciationRows, setDepreciationRows] = useState<DepreciationRow[]>([]);
  const router = useRouter();

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const [summaryRes, categoryRes, departmentRes, statusRes, depreciationRes] = await Promise.all([
        fetch('/api/reports?type=summary'),
        fetch('/api/reports?type=category'),
        fetch('/api/reports?type=department'),
        fetch('/api/reports?type=status'),
        fetch('/api/reports?type=depreciation'),
      ]);

      if (!summaryRes.ok || !categoryRes.ok || !departmentRes.ok || !statusRes.ok || !depreciationRes.ok) {
        throw new Error('Failed to load reports');
      }

      const [summaryData, categoryData, departmentData, statusData, depreciationData] = await Promise.all([
        summaryRes.json(),
        categoryRes.json(),
        departmentRes.json(),
        statusRes.json(),
        depreciationRes.json(),
      ]);

      setSummaryRows(summaryData);
      setCategoryRows(categoryData);
      setDepartmentRows(departmentData);
      setStatusRows(statusData);
      setDepreciationRows(depreciationData);
      setLastUpdated(new Date().toLocaleString('th-TH'));
    } catch {
      setToast({ message: 'โหลดข้อมูลรายงานไม่สำเร็จ', type: 'error' });
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

    void loadReports();
  }, [loadReports, router]);

  const summaryMetrics = useMemo(() => {
    const totalAssets = summaryRows.length;
    const totalValue = summaryRows.reduce((sum, row) => sum + (row.purchasePrice || 0), 0);
    const accumulatedDepreciation = depreciationRows.reduce((sum, row) => sum + (row.accumulatedDepreciation || 0), 0);
    const netBookValue = totalValue - accumulatedDepreciation;

    return {
      totalAssets,
      totalValue,
      accumulatedDepreciation,
      netBookValue,
    };
  }, [depreciationRows, summaryRows]);

  const categoryDistribution = useMemo(() => {
    return categoryRows.map((row) => ({
      ...row,
      totalValue: summaryRows
        .filter((asset) => asset.category === row.category)
        .reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
    }));
  }, [categoryRows, summaryRows]);

  const maxCategoryValue = Math.max(...categoryDistribution.map((row) => row.totalValue), 1);
  const maxDepartmentValue = Math.max(...departmentRows.map((row) => row.totalValue), 1);

  const exportCsv = () => {
    const rows =
      activeTab === 'summary'
        ? summaryRows
        : activeTab === 'category'
          ? categoryDistribution
          : activeTab === 'department'
            ? departmentRows
            : activeTab === 'status'
              ? statusRows
              : depreciationRows;

    if (!rows.length) {
      setToast({ message: 'ไม่มีข้อมูลสำหรับ export', type: 'info' });
      return;
    }

    const headers = Object.keys(rows[0] as Record<string, unknown>);
    const body = rows.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' ? `"${value.replaceAll('"', '""')}"` : String(value ?? '');
        })
        .join(',')
    );

    const csv = [headers.join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports-${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Export CSV สำเร็จ', type: 'success' });
  };

  const exportPdf = () => {
    window.print();
    setToast({ message: 'เปิดหน้าต่างพิมพ์สำหรับ PDF แล้ว', type: 'info' });
  };

  const renderTable = () => {
    const tableClass = 'min-w-full border-collapse';
    const headClass = 'bg-[#2d2d2d] text-left text-lg text-zinc-400';
    const cellClass = 'px-4 py-4 align-middle';

    if (activeTab === 'category') {
      return (
        <table className={tableClass}>
          <thead className={headClass}>
            <tr>
              <th className={cellClass}>Category</th>
              <th className={cellClass}>Assets</th>
              <th className={`${cellClass} text-right`}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {categoryDistribution.map((row) => (
              <tr key={row.category} className="border-t border-white/5 text-white">
                <td className={cellClass}>{row.category}</td>
                <td className={cellClass}>{row.count}</td>
                <td className={`${cellClass} text-right font-bold text-indigo-400`}>{currencyFormatter.format(row.totalValue)} ฿</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'department') {
      return (
        <table className={tableClass}>
          <thead className={headClass}>
            <tr>
              <th className={cellClass}>Department</th>
              <th className={cellClass}>Assets</th>
              <th className={`${cellClass} text-right`}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {departmentRows.map((row) => (
              <tr key={row.department} className="border-t border-white/5 text-white">
                <td className={cellClass}>{row.department}</td>
                <td className={cellClass}>{row.count}</td>
                <td className={`${cellClass} text-right font-bold text-emerald-400`}>{currencyFormatter.format(row.totalValue)} ฿</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'status') {
      return (
        <table className={tableClass}>
          <thead className={headClass}>
            <tr>
              <th className={cellClass}>Status</th>
              <th className={cellClass}>Assets</th>
            </tr>
          </thead>
          <tbody>
            {statusRows.map((row) => (
              <tr key={row.status} className="border-t border-white/5 text-white">
                <td className={cellClass}>{row.status}</td>
                <td className={cellClass}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className={tableClass}>
        <thead className={headClass}>
          <tr>
            <th className={cellClass}>Asset Code</th>
            <th className={cellClass}>Asset Name</th>
            <th className={cellClass}>Fiscal Year</th>
            <th className={`${cellClass} text-right`}>Depreciation</th>
            <th className={`${cellClass} text-right`}>Accumulated</th>
          </tr>
        </thead>
        <tbody>
          {depreciationRows.map((row, index) => (
            <tr key={`${row.assetCode}-${row.fiscalYear}-${index}`} className="border-t border-white/5 text-white">
              <td className={`${cellClass} text-indigo-400`}>{row.assetCode}</td>
              <td className={cellClass}>{row.assetName}</td>
              <td className={cellClass}>{row.fiscalYear}</td>
              <td className={`${cellClass} text-right font-bold text-amber-400`}>{currencyFormatter.format(row.depreciationExpense)} ฿</td>
              <td className={`${cellClass} text-right font-bold text-emerald-400`}>{currencyFormatter.format(row.accumulatedDepreciation)} ฿</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="text-6xl">📋</div>
            <h1 className="text-5xl font-black tracking-tight text-white">Reports & Analytics</h1>
          </div>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-5 py-3 text-lg font-semibold transition-colors ${
                    activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-[#2d2d2d] text-zinc-300 hover:bg-[#363636]'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'summary' ? (
            <>
              <section className="mb-5">
                <h2 className="text-3xl font-bold text-white">Executive Summary</h2>
              </section>

              <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-32 animate-pulse rounded-2xl bg-[#1d1d1d]" />
                  ))
                ) : (
                  <>
                    <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                      <p className="text-lg text-zinc-400">Total Assets</p>
                      <p className="mt-4 text-4xl font-black text-white">{summaryMetrics.totalAssets}</p>
                    </div>
                    <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                      <p className="text-lg text-zinc-400">Total Value</p>
                      <p className="mt-4 text-4xl font-black text-indigo-400">{currencyFormatter.format(summaryMetrics.totalValue)} ฿</p>
                    </div>
                    <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                      <p className="text-lg text-zinc-400">Accumulated Depreciation</p>
                      <p className="mt-4 text-4xl font-black text-amber-400">{currencyFormatter.format(summaryMetrics.accumulatedDepreciation)} ฿</p>
                    </div>
                    <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                      <p className="text-lg text-zinc-400">Net Book Value</p>
                      <p className="mt-4 text-4xl font-black text-emerald-400">{currencyFormatter.format(summaryMetrics.netBookValue)} ฿</p>
                    </div>
                  </>
                )}
              </section>

              <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <h3 className="text-3xl font-bold text-white">Asset Distribution</h3>

                {loading ? (
                  <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <div className="h-64 animate-pulse rounded-xl bg-[#252525]" />
                    <div className="h-64 animate-pulse rounded-xl bg-[#252525]" />
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <div>
                      <p className="mb-5 text-lg font-semibold text-zinc-400">By Category</p>
                      <div className="space-y-5">
                        {categoryDistribution.map((row) => (
                          <div key={row.category}>
                            <div className="mb-1 flex items-center justify-between text-white">
                              <span className="font-semibold">{row.category}</span>
                              <span className="text-zinc-400">{row.count} assets</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#303030]">
                              <div
                                className="h-2 rounded-full bg-indigo-500"
                                style={{ width: `${(row.totalValue / maxCategoryValue) * 100}%` }}
                              />
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">{currencyFormatter.format(row.totalValue)} ฿</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-5 text-lg font-semibold text-zinc-400">By Department</p>
                      <div className="space-y-5">
                        {departmentRows.map((row) => (
                          <div key={row.department}>
                            <div className="mb-1 flex items-center justify-between text-white">
                              <span className="font-semibold">{row.department}</span>
                              <span className="text-zinc-400">{row.count} assets</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#303030]">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${(row.totalValue / maxDepartmentValue) * 100}%` }}
                              />
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">{currencyFormatter.format(row.totalValue)} ฿</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="mb-6 overflow-hidden rounded-2xl bg-[#1d1d1d] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6">
                    <div className="h-12 animate-pulse rounded bg-[#252525]" />
                  </div>
                ) : (
                  renderTable()
                )}
              </div>
            </section>
          )}

          <section className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              📥 Export CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={loading}
              className="rounded-lg bg-indigo-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
            >
              📄 Export PDF
            </button>
            <button
              type="button"
              onClick={() => void loadReports()}
              disabled={loading}
              className="rounded-lg bg-[#2d2d2d] px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-[#3a3a3a] disabled:opacity-50"
            >
              {loading ? 'Loading...' : '🔄 Refresh Data'}
            </button>
          </section>

          <p className="mt-4 text-sm text-zinc-500">Last updated: {lastUpdated || '-'}</p>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
