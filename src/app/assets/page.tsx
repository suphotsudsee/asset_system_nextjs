'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useAppLanguage } from '@/lib/language';

interface Category {
  id: number;
  name: string;
  code: string;
}

interface Department {
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

export default function AssetsPage() {
  const { language, locale, t } = useAppLanguage();
  const qrRevision = 'offline-v2';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

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

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) return;

      const data = await res.json();
      setDepartments(data);
    } catch {
      console.error('Failed to fetch departments');
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(departmentFilter ? { department: departmentFilter } : {}),
      });

      const res = await fetch(`/api/assets?${params}`);
      if (!res.ok) return;

      const data: AssetsResponse = await res.json();
      setAssets(data.assets);
      setSelectedAssetIds((current) => current.filter((id) => data.assets.some((asset) => asset.id === id)));
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalRecords(data.pagination?.total ?? 0);
    } catch {
      console.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, departmentFilter, page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void Promise.all([fetchCategories(), fetchDepartments()]);
  }, [fetchCategories, fetchDepartments, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    void fetchAssets();
  }, [fetchAssets]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: t('statusActive'), className: 'bg-emerald-950 text-emerald-400' };
      case 'inactive':
        return { label: t('statusInactive'), className: 'bg-zinc-800 text-zinc-300' };
      case 'maintenance':
        return { label: t('statusMaintenance'), className: 'bg-amber-950 text-amber-400' };
      case 'disposed':
        return { label: t('statusDisposed'), className: 'bg-rose-950 text-rose-400' };
      default:
        return { label: status || '-', className: 'bg-zinc-800 text-zinc-300' };
    }
  };

  const handleDeleteRequest = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      const res = await fetch(`/api/assets/${assetToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: t('assetsDeleteSuccess'), type: 'success' });
        setAssets((current) => current.filter((asset) => asset.id !== assetToDelete.id));
        setSelectedAssetIds((current) => current.filter((id) => id !== assetToDelete.id));
        void fetchAssets();
      } else {
        setToast({ message: t('assetsDeleteFailed'), type: 'error' });
      }
    } catch {
      setToast({ message: t('assetsUnexpectedError'), type: 'error' });
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
      setToast({ message: t('assetsPrintPopupError'), type: 'error' });
      return;
    }

    const qrImageUrl = `${window.location.origin}/api/qr/${asset.id}/image?rev=${qrRevision}`;
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
            <div class="hint">${t('assetsPrintHint')}</div>
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
      setToast({ message: t('assetsSelectBeforePrint'), type: 'info' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=1400');
    if (!printWindow) {
      setToast({ message: t('assetsPrintPopupError'), type: 'error' });
      return;
    }

    const pageSize = 20;
    const pages = Array.from({ length: Math.ceil(selectedAssets.length / pageSize) }, (_, index) =>
      selectedAssets.slice(index * pageSize, (index + 1) * pageSize)
    );

    const pageMarkup = pages
      .map((pageAssets) => {
        const labels = pageAssets
          .map((asset) => {
            const escapedName = asset.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
            const escapedCode = asset.assetCode.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
            const qrImageUrl = `${window.location.origin}/api/qr/${asset.id}/image?rev=${qrRevision}`;

            return `
              <div class="label">
                <div class="asset-name">${escapedName}</div>
                <div class="asset-code">${escapedCode}</div>
                <img src="${qrImageUrl}" alt="QR Code for ${escapedCode}" />
              </div>
            `;
          })
          .join('');

        return `
          <section class="sheet">
            <div class="grid">${labels}</div>
          </section>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Print Asset QR Codes</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; color: #111827; }
            .sheet { width: 194mm; min-height: 280mm; margin: 0 auto; page-break-after: always; break-after: page; }
            .sheet:last-child { page-break-after: auto; break-after: auto; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
            .label {
              height: 52mm;
              border: 1px solid #d4d4d8;
              border-radius: 6px;
              padding: 3mm 2.5mm;
              text-align: center;
              box-sizing: border-box;
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
            }
            .asset-name {
              font-size: 10px;
              font-weight: 700;
              line-height: 1.2;
              min-height: 24px;
              max-height: 24px;
              width: 100%;
              overflow: hidden;
            }
            .asset-code { margin-top: 2px; font-size: 9px; color: #4f46e5; line-height: 1.2; }
            img { width: 28mm; height: 28mm; display: block; margin: 3mm auto 0; }
          </style>
        </head>
        <body>
          ${pageMarkup}
          <script>
            window.addEventListener('load', function () { window.print(); });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                <h1 className="text-5xl font-black tracking-tight text-white">{t('assetsTitle')}</h1>
              </div>
            </div>

            <Link
              href="/assets/add"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-7 py-4 text-xl font-bold text-white transition-colors hover:bg-emerald-400"
            >
              <span className="mr-3 text-2xl text-violet-300">＋</span>
              {t('assetsAddNew')}
            </Link>
          </div>

          <section className="mb-6 rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <label className="block text-xl text-zinc-400">{t('assetsSearch')}</label>
                <input
                  type="text"
                  placeholder={t('assetsSearchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </form>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">{t('assetsCategory')}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setPage(1);
                    setCategoryFilter(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{t('assetsAllCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">{t('assetsStatus')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{t('assetsAllStatus')}</option>
                  <option value="active">{t('statusActive')}</option>
                  <option value="inactive">{t('statusInactive')}</option>
                  <option value="maintenance">{t('statusMaintenance')}</option>
                  <option value="disposed">{t('statusDisposed')}</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-xl text-zinc-400">{language === 'th' ? 'หน่วยงาน' : 'Department'}</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setPage(1);
                    setDepartmentFilter(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-lg text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">{language === 'th' ? 'ทุกหน่วยงาน' : 'All Departments'}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">{t('assetsSelected', { count: selectedAssetIds.length })}</p>
            <button
              type="button"
              onClick={handleBulkPrintQr}
              className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
            >
              {t('assetsPrintSelected')}
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
                    <th className="px-4 py-5 font-semibold">{t('assetsAssetCode')}</th>
                    <th className="px-4 py-5 font-semibold">{t('assetsName')}</th>
                    <th className="px-4 py-5 font-semibold">{t('assetsCategory')}</th>
                    <th className="px-4 py-5 font-semibold">{t('assetsDepartment')}</th>
                    <th className="px-4 py-5 font-semibold">{t('assetsStatus')}</th>
                    <th className="px-4 py-5 text-right font-semibold">{t('assetsPrice')}</th>
                    <th className="px-4 py-5 text-right font-semibold">{t('assetsActions')}</th>
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
                        {t('assetsNoData')}
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => {
                      const status = getStatusConfig(asset.status);

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
                                {t('assetsView')}
                              </Link>
                              <button
                                type="button"
                                onClick={() => handlePrintQr(asset)}
                                className="font-semibold text-emerald-400 hover:text-emerald-300"
                              >
                                {t('assetsPrintQr')}
                              </button>
                              <Link href={`/assets/${asset.id}/edit`} className="font-semibold text-indigo-400 hover:text-indigo-300">
                                {t('assetsEdit')}
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(asset)}
                                className="font-semibold text-red-500 hover:text-red-400"
                              >
                                {t('assetsDelete')}
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <p className="text-base">{t('assetsPageOf', { page, total: Math.max(totalPages, 1) })}</p>
                <p className="text-sm text-zinc-500">
                  {language === 'th'
                    ? `ทั้งหมด ${numberFormatter.format(totalRecords)} รายการ`
                    : `${numberFormatter.format(totalRecords)} total record(s)`}
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-400">
                    {language === 'th' ? 'แสดงต่อหน้า' : 'Rows per page'}
                  </label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setPage(1);
                      setRowsPerPage(parseInt(e.target.value, 10));
                    }}
                    className="rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-sm font-semibold text-zinc-300 outline-none transition-colors focus:border-indigo-500"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('assetsPrevious')}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('assetsNext')}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('assetsDeleteTitle')}
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              {t('assetsDeleteCancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-500"
            >
              {t('assetsDeleteConfirm')}
            </button>
          </div>
        }
      >
        <p className="text-gray-300">{t('assetsDeletePrompt', { name: assetToDelete?.name || '' })}</p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
