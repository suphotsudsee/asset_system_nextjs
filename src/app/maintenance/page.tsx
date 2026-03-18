'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useAppLanguage } from '@/lib/language';

interface AssetOption {
  id: number;
  assetCode: string;
  name: string;
}

interface Maintenance {
  id: number;
  assetId: number;
  maintenanceType: string;
  title: string;
  description?: string | null;
  priority: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  status: string;
  laborCost: number | null;
  totalCost: number;
  technicianName?: string | null;
  asset?: {
    assetCode: string;
    name: string;
  };
}

const typeStyles: Record<string, string> = {
  preventive: 'bg-emerald-950 text-emerald-400',
  corrective: 'bg-amber-950 text-amber-400',
  emergency: 'bg-rose-950 text-rose-400',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-950 text-amber-400',
  in_progress: 'bg-indigo-950 text-indigo-400',
  completed: 'bg-emerald-950 text-emerald-400',
  cancelled: 'bg-zinc-800 text-zinc-300',
};

export default function MaintenancePage() {
  const { language, locale } = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    assetId: 0,
    maintenanceType: 'preventive',
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    status: 'pending',
    laborCost: 0,
    partsCost: 0,
    technicianName: '',
  });
  const router = useRouter();
  const currencyDisplay = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const typeLabels = useMemo(
    () => ({
      preventive: language === 'th' ? 'บำรุงรักษาเชิงป้องกัน' : 'Preventive',
      corrective: language === 'th' ? 'ซ่อมแก้ไข' : 'Corrective',
      emergency: language === 'th' ? 'ฉุกเฉิน' : 'Emergency',
    }),
    [language]
  );
  const statusLabels = useMemo(
    () => ({
      pending: language === 'th' ? 'รอดำเนินการ' : 'Pending',
      in_progress: language === 'th' ? 'กำลังดำเนินการ' : 'In Progress',
      completed: language === 'th' ? 'เสร็จสิ้น' : 'Completed',
      cancelled: language === 'th' ? 'ยกเลิก' : 'Cancelled',
    }),
    [language]
  );

  const fetchMaintenances = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/maintenance');
      if (!res.ok) return;

      const data = await res.json();
      setMaintenances(data);
    } catch {
      console.error('Failed to fetch maintenances');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets?page=1&limit=100');
      if (!res.ok) return;

      const data = await res.json();
      const items: AssetOption[] = data.assets ?? [];
      setAssets(items);

      if (items.length > 0) {
        setFormData((current) => ({
          ...current,
          assetId: current.assetId || items[0].id,
        }));
      }
    } catch {
      console.error('Failed to fetch assets');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void Promise.all([fetchMaintenances(), fetchAssets()]);
  }, [fetchAssets, fetchMaintenances, router]);

  const resetForm = () => {
    setFormData({
      assetId: assets[0]?.id ?? 0,
      maintenanceType: 'preventive',
      title: '',
      description: '',
      priority: 'medium',
      scheduledDate: '',
      status: 'pending',
      laborCost: 0,
      partsCost: 0,
      technicianName: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.assetId || !formData.title.trim()) {
      setToast({ message: 'กรุณากรอกข้อมูลให้ครบ', type: 'info' });
      return;
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ message: 'สร้างรายการซ่อมบำรุงสำเร็จ', type: 'success' });
        setCreateModalOpen(false);
        resetForm();
        void fetchMaintenances();
      } else {
        setToast({ message: 'สร้างรายการซ่อมบำรุงไม่สำเร็จ', type: 'error' });
      }
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (typeFilter && item.maintenanceType !== typeFilter) return false;
      return true;
    });
  }, [maintenances, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    return filteredMaintenances.reduce(
      (acc, item) => {
        acc.totalRequests += 1;
        if (item.status === 'pending') acc.pending += 1;
        if (item.status === 'in_progress') acc.inProgress += 1;
        acc.totalCost += item.totalCost ?? 0;
        return acc;
      },
      {
        totalRequests: 0,
        pending: 0,
        inProgress: 0,
        totalCost: 0,
      }
    );
  }, [filteredMaintenances]);

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="text-6xl">🔧</div>
              <h1 className="text-5xl font-black tracking-tight text-white">Maintenance Management</h1>
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-7 py-4 text-xl font-bold text-white transition-colors hover:bg-emerald-400"
            >
              <span className="mr-3 text-2xl text-violet-300">＋</span>
              Schedule Maintenance
            </button>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Total Requests</p>
              <p className="mt-4 text-4xl font-black text-white">{summary.totalRequests}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Pending</p>
              <p className="mt-4 text-4xl font-black text-amber-400">{summary.pending}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">In Progress</p>
              <p className="mt-4 text-4xl font-black text-indigo-400">{summary.inProgress}</p>
            </div>
            <div className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <p className="text-lg text-zinc-400">Total Cost</p>
              <p className="mt-4 text-4xl font-black text-emerald-400">{currencyDisplay.format(summary.totalCost)} ฿</p>
            </div>
          </section>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <label className="text-2xl text-zinc-400">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-44 rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทั้งหมด' : 'All'}</option>
                  <option value="pending">{statusLabels.pending}</option>
                  <option value="in_progress">{statusLabels.in_progress}</option>
                  <option value="completed">{statusLabels.completed}</option>
                  <option value="cancelled">{statusLabels.cancelled}</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-2xl text-zinc-400">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-44 rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทั้งหมด' : 'All'}</option>
                  <option value="preventive">{typeLabels.preventive}</option>
                  <option value="corrective">{typeLabels.corrective}</option>
                  <option value="emergency">{typeLabels.emergency}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#1d1d1d] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#2d2d2d] text-left">
                  <tr className="text-lg text-zinc-400">
                    <th className="px-4 py-5 font-semibold">Asset</th>
                    <th className="px-4 py-5 font-semibold">Type</th>
                    <th className="px-4 py-5 font-semibold">Status</th>
                    <th className="px-4 py-5 font-semibold">Scheduled Date</th>
                    <th className="px-4 py-5 font-semibold">Technician</th>
                    <th className="px-4 py-5 text-right font-semibold">Cost</th>
                    <th className="px-4 py-5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-t border-white/5">
                        <td className="px-4 py-6" colSpan={7}>
                          <div className="h-8 animate-pulse rounded bg-[#2a2a2a]" />
                        </td>
                      </tr>
                    ))
                  ) : filteredMaintenances.length === 0 ? (
                    <tr className="border-t border-white/5">
                      <td colSpan={7} className="px-4 py-14 text-center text-lg text-zinc-500">
                        ไม่พบข้อมูลงานซ่อมบำรุง
                      </td>
                    </tr>
                  ) : (
                    filteredMaintenances.map((item) => {
                      const typeClass = typeStyles[item.maintenanceType] ?? 'bg-zinc-800 text-zinc-300';
                      const statusClass = statusStyles[item.status] ?? 'bg-zinc-800 text-zinc-300';

                      return (
                        <tr key={item.id} className="border-t border-white/5 text-lg text-white">
                          <td className="px-4 py-6 align-middle">
                            <p className="font-semibold text-white">{item.asset?.name || item.title}</p>
                            <p className="mt-1 text-base text-indigo-400">{item.asset?.assetCode || '-'}</p>
                          </td>
                          <td className="px-4 py-6 align-middle">
                            <span className={`inline-flex rounded-md px-4 py-1 text-sm font-bold ${typeClass}`}>
                              {typeLabels[item.maintenanceType as keyof typeof typeLabels] || item.maintenanceType}
                            </span>
                          </td>
                          <td className="px-4 py-6 align-middle">
                            <span className={`inline-flex rounded-full px-4 py-1 text-sm font-bold ${statusClass}`}>
                              {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                            </span>
                          </td>
                          <td className="px-4 py-6 align-middle text-zinc-400">{formatDate(item.scheduledDate)}</td>
                          <td className="px-4 py-6 align-middle">{item.technicianName || '-'}</td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-emerald-400">
                            {currencyDisplay.format(item.totalCost)} ฿
                          </td>
                          <td className="px-4 py-6 text-right align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                setCreateModalOpen(true);
                                setFormData({
                                  assetId: item.assetId,
                                  maintenanceType: item.maintenanceType,
                                  title: item.title,
                                  description: item.description || '',
                                  priority: item.priority,
                                  scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : '',
                                  status: item.status,
                                  laborCost: item.laborCost ?? item.totalCost,
                                  partsCost: 0,
                                  technicianName: item.technicianName || '',
                                });
                              }}
                              className="font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Maintenance"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-gray-300">Asset</label>
            <select
              value={formData.assetId}
              onChange={(e) => setFormData((current) => ({ ...current, assetId: parseInt(e.target.value, 10) }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetCode} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-gray-300">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Type</label>
            <select
              value={formData.maintenanceType}
              onChange={(e) => setFormData((current) => ({ ...current, maintenanceType: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            >
              <option value="preventive">{typeLabels.preventive}</option>
              <option value="corrective">{typeLabels.corrective}</option>
              <option value="emergency">{typeLabels.emergency}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            >
              <option value="pending">{statusLabels.pending}</option>
              <option value="in_progress">{statusLabels.in_progress}</option>
              <option value="completed">{statusLabels.completed}</option>
              <option value="cancelled">{statusLabels.cancelled}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((current) => ({ ...current, priority: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Scheduled Date</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData((current) => ({ ...current, scheduledDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Technician</label>
            <input
              type="text"
              value={formData.technicianName}
              onChange={(e) => setFormData((current) => ({ ...current, technicianName: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Labor Cost</label>
            <input
              type="number"
              min="0"
              value={formData.laborCost}
              onChange={(e) => setFormData((current) => ({ ...current, laborCost: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-gray-300">Parts Cost</label>
            <input
              type="number"
              min="0"
              value={formData.partsCost}
              onChange={(e) => setFormData((current) => ({ ...current, partsCost: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
            />
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
