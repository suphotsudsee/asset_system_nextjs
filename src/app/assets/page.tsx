'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

interface Category {
  id: number;
  name: string;
  code: string;
}

interface AssetCategory {
  id: number;
  name: string;
  code: string;
}

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  purchasePrice: number;
  status: string;
  department?: string | null;
  location?: string | null;
  category?: AssetCategory | null;
}

interface AssetsResponse {
  assets: Asset[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const numberFormatter = new Intl.NumberFormat('th-TH');

const statusMap: Record<string, { label: string; className: string }> = {
  active: {
    label: 'active',
    className: 'bg-emerald-950 text-emerald-400',
  },
  inactive: {
    label: 'inactive',
    className: 'bg-zinc-800 text-zinc-300',
  },
  maintenance: {
    label: 'maintenance',
    className: 'bg-amber-950 text-amber-400',
  },
  disposed: {
    label: 'disposed',
    className: 'bg-rose-950 text-rose-400',
  },
};

export default function AssetsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;

      const data = await res.json();
      setCategories(data);
    } catch {
      console.error('Failed to fetch categories');
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
      });

      const res = await fetch(`/api/assets?${params}`);
      if (!res.ok) return;

      const data: AssetsResponse = await res.json();
      setAssets(data.assets);
      setSelectedAssetIds((current) => current.filter((id) => data.assets.some((asset) => asset.id === id)));
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      console.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page, search, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void fetchCategories();
  }, [fetchCategories, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    void fetchAssets();
  }, [fetchAssets]);

  const handleDeleteRequest = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      const res = await fetch(`/api/assets/${assetToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'ลบครุภัณฑ์สำเร็จ', type: 'success' });
        setAssets((current) => current.filter((asset) => asset.id !== assetToDelete.id));
        setSelectedAssetIds((current) => current.filter((id) => id !== assetToDelete.id));
        void fetchAssets();
      } else {
        setToast({ message: 'ลบครุภัณฑ์ไม่สำเร็จ', type: 'error' });
      }
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setDeleteModalOpen(false);
      setAssetToDelete(null);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = assets.map((asset) => asset.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedAssetIds.includes(id));

    setSelectedAssetIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  };

  const handlePrintQr = (asset: Asset) => {
    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) {
      setToast({ message: 'ไม่สามารถเปิดหน้าต่างพิมพ์ได้', type: 'error' });
      return;
    }

    const qrImageUrl = `${window.location.origin}/api/qr/${asset.id}/image`;
    const escapedName = asset.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const escapedCode = asset.assetCode.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Print QR - ${escapedCode}</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; }
            .sheet { width: 300px; margin: 24px auto; border: 1px solid #d4d4d8; border-radius: 12px; padding: 20px; text-align: center; }
            .title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #18181b; }
            .code { font-size: 14px; color: #4f46e5; margin-bottom: 16px; }
            img { width: 220px; height: 220px; display: block; margin: 0 auto 16px; }
            .hint { font-size: 12px; color: #52525b; line-height: 1.5; }
            @media print { .sheet { margin: 0 auto; border: none; } }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="title">${escapedName}</div>
            <div class="code">${escapedCode}</div>
            <img src="${qrImageUrl}" alt="QR Code for ${escapedCode}" />
            <div class="hint">Scan this QR code to open asset information.</div>
          </div>
          <script>
            window.addEventListener('load', function () { window.print(); });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleBulkPrintQr = () => {
    const selectedAssets = assets.filter((asset) => selectedAssetIds.includes(asset.id));
    if (selectedAssets.length === 0) {
      setToast({ message: 'กรุณาเลือกครุภัณฑ์ก่อนพิมพ์', type: 'info' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=1400');
    if (!printWindow) {
      setToast({ message: 'ไม่สามารถเปิดหน้าต่างพิมพ์ได้', type: 'error' });
      return;
    }

    const labels = selectedAssets
      .map((asset) => {
        const escapedName = asset.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        const escapedCode = asset.assetCode.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
        const qrImageUrl = `${window.location.origin}/api/qr/${asset.id}/image`;

        return `
          <div class="label">
            <div class="asset-name">${escapedName}</div>
            <div class="asset-code">${escapedCode}</div>
            <img src="${qrImageUrl}" alt="QR Code for ${escapedCode}" />
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Print Asset QR Codes</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; color: #111827; }
            .sheet { width: 190mm; margin: 0 auto; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
            .label { border: 1px solid #d4d4d8; border-radius: 10px; padding: 6mm 4mm; text-align: center; break-inside: avoid; }
            .asset-name { font-size: 14px; font-weight: 700; line-height: 1.3; min-height: 36px; }
            .asset-code { margin-top: 4px; font-size: 12px; color: #4f46e5; }
            img { width: 42mm; height: 42mm; display: block; margin: 6px auto 0; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="grid">${labels}</div>
          </div>
          <script>
            window.addEventListener('load', function () { window.print(); });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusConfig = (status: string) =>
    statusMap[status] ?? {
      label: status || 'unknown',
      className: 'bg-zinc-800 text-zinc-300',
    };

  const allVisibleSelected = assets.length > 0 && assets.every((asset) => selectedAssetIds.includes(asset.id));

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="text-6xl">📦</div>
              <div>
                <h1 className="text-5xl font-black tracking-tight text-white">Assets Management</h1>
              </div>
            </div>

            <Link
              href="/assets/add"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-7 py-4 text-xl font-bold text-white transition-colors hover:bg-emerald-400"
            >
              <span className="mr-3 text-2xl text-violet-300">＋</span>
              Add New Asset
            </Link>
          </div>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <label className="block text-xl text-zinc-400">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </form>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setPage(1);
                    setCategoryFilter(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
            </div>
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Selected: {selectedAssetIds.length} item{selectedAssetIds.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={handleBulkPrintQr}
              className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
            >
              Print Selected QR (A4)
            </button>
          </div>

          <section className="overflow-hidden rounded-2xl bg-[#1d1d1d] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#2d2d2d] text-left">
                  <tr className="text-lg text-zinc-400">
                    <th className="px-4 py-5 font-semibold">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-white/20 bg-[#252525]"
                      />
                    </th>
                    <th className="px-4 py-5 font-semibold">Asset Code</th>
                    <th className="px-4 py-5 font-semibold">Name</th>
                    <th className="px-4 py-5 font-semibold">Category</th>
                    <th className="px-4 py-5 font-semibold">Department</th>
                    <th className="px-4 py-5 font-semibold">Status</th>
                    <th className="px-4 py-5 text-right font-semibold">Price</th>
                    <th className="px-4 py-5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="border-t border-white/5">
                        <td className="px-4 py-6" colSpan={8}>
                          <div className="h-8 animate-pulse rounded bg-[#2a2a2a]" />
                        </td>
                      </tr>
                    ))
                  ) : assets.length === 0 ? (
                    <tr className="border-t border-white/5">
                      <td colSpan={8} className="px-4 py-14 text-center text-lg text-zinc-500">
                        ไม่พบข้อมูลครุภัณฑ์
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => {
                      const status = statusConfig(asset.status);

                      return (
                        <tr key={asset.id} className="border-t border-white/5 text-lg text-white">
                          <td className="px-4 py-6 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedAssetIds.includes(asset.id)}
                              onChange={() => toggleAssetSelection(asset.id)}
                              className="h-4 w-4 rounded border-white/20 bg-[#252525]"
                            />
                          </td>
                          <td className="px-4 py-6 align-middle">
                            <Link href={`/assets/${asset.id}`} className="font-medium text-indigo-400 hover:text-indigo-300">
                              {asset.assetCode}
                            </Link>
                          </td>
                          <td className="px-4 py-6 align-middle font-semibold text-white">{asset.name}</td>
                          <td className="px-4 py-6 align-middle text-zinc-400">{asset.category?.name || '-'}</td>
                          <td className="px-4 py-6 align-middle text-zinc-400">{asset.department || asset.location || '-'}</td>
                          <td className="px-4 py-6 align-middle">
                            <span className={`inline-flex rounded-full px-4 py-1 text-sm font-bold ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-6 text-right align-middle font-bold text-emerald-400">
                            {numberFormatter.format(asset.purchasePrice)} ฿
                          </td>
                          <td className="px-4 py-6 text-right align-middle">
                            <div className="flex items-center justify-end gap-6">
                              <Link href={`/assets/${asset.id}`} className="font-semibold text-indigo-400 hover:text-indigo-300">
                                View
                              </Link>
                              <button
                                type="button"
                                onClick={() => handlePrintQr(asset)}
                                className="font-semibold text-emerald-400 hover:text-emerald-300"
                              >
                                Print QR
                              </button>
                              <Link href={`/assets/${asset.id}/edit`} className="font-semibold text-indigo-400 hover:text-indigo-300">
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(asset)}
                                className="font-semibold text-red-500 hover:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/5 px-6 py-5 text-zinc-400 md:flex-row md:items-center md:justify-between">
              <p className="text-base">
                Page {page} of {Math.max(totalPages, 1)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="ยืนยันการลบ"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-500"
            >
              ลบ
            </button>
          </div>
        }
      >
        <p className="text-gray-300">
          คุณต้องการลบครุภัณฑ์
          {assetToDelete ? ` "${assetToDelete.name}"` : ''}
          ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
