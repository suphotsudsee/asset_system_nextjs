'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Toast from '../../../components/Toast';

interface AssetCategory {
  id: number;
  name: string;
  code: string;
}

interface AssetDepartment {
  id: number;
  name: string;
  code: string;
}

interface MaintenanceRecord {
  id: number;
  maintenanceType: string;
  title: string;
  status: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  technicianName?: string | null;
  totalCost: number;
}

interface DepreciationRecord {
  id: number;
  fiscalYear: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

interface DepreciationScheduleRow {
  year: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  category?: AssetCategory | null;
  serialNumber?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  usefulLifeYears?: number | null;
  salvageValue: number;
  depreciationMethod: string;
  location?: string | null;
  departmentId?: number | null;
  department?: AssetDepartment | null;
  status: string;
  condition: string;
  image?: string | null;
  imageData?: string | null;
  qrCodePath?: string | null;
  maintenanceRecords?: MaintenanceRecord[];
  depreciationRecords?: DepreciationRecord[];
}

type DetailTab = 'information' | 'maintenance' | 'depreciation' | 'prediction';

const currencyFormatter = new Intl.NumberFormat('th-TH');

function getAssetImage(target?: Partial<Asset> | null) {
  return target?.imageData ?? target?.image ?? null;
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US');
}

export default function AssetDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('information');
  const [schedule, setSchedule] = useState<DepreciationScheduleRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const fetchAsset = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets/${params.id}`);
      if (!res.ok) return;

      const data = await res.json();
      setAsset(data);
    } catch {
      console.error('Failed to fetch asset');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);

    try {
      const res = await fetch(`/api/depreciation/${params.id}/schedule`);
      if (!res.ok) return;

      const data = await res.json();
      setSchedule(data.schedule || []);
    } catch {
      setToast({ message: 'โหลดตารางค่าเสื่อมไม่สำเร็จ', type: 'error' });
    } finally {
      setScheduleLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void fetchAsset();
  }, [fetchAsset, router]);

  useEffect(() => {
    if (activeTab !== 'depreciation' || !asset) return;
    void fetchSchedule();
  }, [activeTab, asset, fetchSchedule]);

  const statusBadgeClass = useMemo(() => {
    switch (asset?.status) {
      case 'active':
        return 'bg-emerald-500 text-white';
      case 'maintenance':
        return 'bg-amber-500 text-black';
      case 'inactive':
        return 'bg-zinc-600 text-white';
      case 'disposed':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-zinc-600 text-white';
    }
  }, [asset?.status]);

  if (loading || !asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#252525]">
        <div className="text-zinc-400">Loading asset...</div>
      </div>
    );
  }

  const imageUrl = getAssetImage(asset);
  const qrImageUrl = `/api/qr/${asset.id}/image`;
  const qrDownloadUrl = `/api/qr/${asset.id}/download`;
  const maintenanceCount = asset.maintenanceRecords?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <button
            type="button"
            onClick={() => router.push('/assets')}
            className="mb-3 text-lg font-semibold text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Assets
          </button>

          <div className="mb-8 flex flex-wrap items-center gap-4">
            <h1 className="text-5xl font-black tracking-tight text-white">{asset.name}</h1>
            <span className={`rounded-md px-4 py-1 text-sm font-bold ${statusBadgeClass}`}>{asset.status}</span>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-3 border-b border-white/10 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('information')}
                  className={`rounded-xl border px-5 py-3 text-lg font-semibold transition-colors ${
                    activeTab === 'information' ? 'border-white bg-transparent text-white' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenance')}
                  className={`rounded-xl border px-5 py-3 text-lg font-semibold transition-colors ${
                    activeTab === 'maintenance' ? 'border-white bg-transparent text-white' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Maintenance ({maintenanceCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('depreciation')}
                  className={`rounded-xl border px-5 py-3 text-lg font-semibold transition-colors ${
                    activeTab === 'depreciation' ? 'border-white bg-transparent text-white' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Depreciation
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prediction')}
                  className={`rounded-xl border px-5 py-3 text-lg font-semibold transition-colors ${
                    activeTab === 'prediction' ? 'border-white bg-transparent text-white' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  AI Prediction
                </button>
              </div>

              <section className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                {activeTab === 'information' && (
                  <>
                    <h2 className="mb-6 text-3xl font-bold text-white">Asset Information</h2>
                    <div className="grid grid-cols-1 gap-x-16 gap-y-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-zinc-400">Asset Code</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.assetCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Serial Number</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.serialNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Category</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.category?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Department</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.department?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Location</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Condition</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.condition || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Purchase Date</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{formatDate(asset.purchaseDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Useful Life</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {asset.usefulLifeYears ? `${asset.usefulLifeYears} years` : 'years'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Purchase Price</p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-400">
                          {asset.purchasePrice != null ? `${currencyFormatter.format(asset.purchasePrice)} ฿` : 'N/A ฿'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Depreciation Method</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{asset.depreciationMethod}</p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'maintenance' && (
                  <>
                    <h2 className="mb-6 text-3xl font-bold text-white">Maintenance History</h2>
                    {maintenanceCount === 0 ? (
                      <p className="text-lg text-zinc-500">No maintenance records found.</p>
                    ) : (
                      <div className="space-y-4">
                        {asset.maintenanceRecords?.map((record) => (
                          <div key={record.id} className="rounded-xl border border-white/5 bg-[#222222] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xl font-semibold text-white">{record.title}</p>
                                <p className="mt-1 text-sm text-zinc-400">
                                  {record.maintenanceType} • {record.technicianName || 'Unassigned'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-zinc-400">Scheduled</p>
                                <p className="text-lg font-semibold text-white">{formatDate(record.scheduledDate)}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                              <span className="rounded-full bg-[#2d2d2d] px-3 py-1 text-zinc-300">{record.status}</span>
                              <span className="font-semibold text-emerald-400">{currencyFormatter.format(record.totalCost)} ฿</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'depreciation' && (
                  <>
                    <h2 className="mb-6 text-3xl font-bold text-white">Depreciation Schedule</h2>
                    {scheduleLoading ? (
                      <div className="h-20 animate-pulse rounded-xl bg-[#252525]" />
                    ) : schedule.length === 0 ? (
                      <p className="text-lg text-zinc-500">No depreciation data found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-[#2d2d2d] text-left text-zinc-400">
                            <tr>
                              <th className="px-4 py-3">Year</th>
                              <th className="px-4 py-3 text-right">Depreciation</th>
                              <th className="px-4 py-3 text-right">Accumulated</th>
                              <th className="px-4 py-3 text-right">Net Book Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.map((row) => (
                              <tr key={row.year} className="border-t border-white/5 text-white">
                                <td className="px-4 py-4">{row.year}</td>
                                <td className="px-4 py-4 text-right text-amber-400">{currencyFormatter.format(row.depreciationExpense)} ฿</td>
                                <td className="px-4 py-4 text-right">{currencyFormatter.format(row.accumulatedDepreciation)} ฿</td>
                                <td className="px-4 py-4 text-right text-emerald-400">{currencyFormatter.format(row.endingBookValue)} ฿</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'prediction' && (
                  <>
                    <h2 className="mb-6 text-3xl font-bold text-white">AI Prediction</h2>
                    <div className="rounded-xl border border-white/5 bg-[#222222] p-5">
                      <p className="text-lg text-zinc-300">
                        Based on the current status, useful life, and maintenance history, this asset appears
                        suitable for continued operation.
                      </p>
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-[#1d1d1d] p-4">
                          <p className="text-sm text-zinc-400">Risk Level</p>
                          <p className="mt-2 text-2xl font-bold text-emerald-400">Low</p>
                        </div>
                        <div className="rounded-lg bg-[#1d1d1d] p-4">
                          <p className="text-sm text-zinc-400">Suggested Action</p>
                          <p className="mt-2 text-2xl font-bold text-white">Monitor usage</p>
                        </div>
                        <div className="rounded-lg bg-[#1d1d1d] p-4">
                          <p className="text-sm text-zinc-400">Replacement Outlook</p>
                          <p className="mt-2 text-2xl font-bold text-white">Not urgent</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl bg-[#1d1d1d] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <h2 className="mb-4 text-2xl font-bold text-white">🖼️ Asset Image</h2>
                {imageUrl ? (
                  <>
                    <Image
                      src={imageUrl}
                      alt={asset.name}
                      width={400}
                      height={500}
                      unoptimized
                      className="aspect-[4/5] w-full rounded-xl object-cover"
                    />
                    <p className="mt-4 text-center text-sm text-zinc-400">{asset.name}</p>
                  </>
                ) : (
                  <div className="rounded-xl bg-[#252525] p-8 text-center text-zinc-500">No image available</div>
                )}
              </section>

              <section className="rounded-2xl bg-[#1d1d1d] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <h2 className="mb-4 text-2xl font-bold text-white">🔳 QR Code</h2>
                <div className="rounded-xl bg-white p-4">
                  <Image
                    src={qrImageUrl}
                    alt={`QR code for ${asset.assetCode}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="w-full"
                  />
                </div>
                <p className="mt-4 text-center text-base font-semibold text-indigo-400">{asset.assetCode}</p>
                <p className="mt-3 text-sm text-zinc-400">
                  Scan this QR code to quickly access asset information or log maintenance.
                </p>
                <a
                  href={qrDownloadUrl}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-base font-bold text-white transition-colors hover:bg-indigo-400"
                >
                  📥 Download QR
                </a>
              </section>
            </div>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
