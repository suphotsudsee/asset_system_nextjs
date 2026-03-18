'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import AssetCard from '../../components/AssetCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import Link from 'next/link';

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description?: string | null;
  purchasePrice: number;
  status: string;
  condition: string;
  department?: string | null;
  location?: string | null;
  qrCodePath?: string | null;
  image?: string | null;
  imageData?: string | null;
}

export default function AssetsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchAssets();
  }, [page, search, statusFilter]);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (e) {
      console.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    try {
      const res = await fetch(`/api/assets/${assetToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'ลบครุภัณฑ์สำเร็จ', type: 'success' });
        fetchAssets();
      } else {
        setToast({ message: 'ลบไม่สำเร็จ', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
    setDeleteModalOpen(false);
    setAssetToDelete(null);
  };

  const filteredAssets = assets.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.assetCode.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter && a.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">ครุภัณฑ์ทั้งหมด</h1>
            <Link href="/assets/add" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              ➕ เพิ่มครุภัณฑ์
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ รหัสครุภัณฑ์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
              <option value="maintenance">บำรุงรักษา</option>
              <option value="disposed">จำหน่าย</option>
            </select>
          </div>

          {loading ? (
            <div className="text-gray-400">กำลังโหลด...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="hover:bg-gray-700 transition-colors">
                    <AssetCard asset={asset} />
                  </div>
                ))}
              </div>

              {filteredAssets.length === 0 && (
                <div className="text-center text-gray-400 py-12">ไม่พบครุภัณฑ์</div>
              )}

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                >
                  ← ก่อนหน้า
                </button>
                <span className="text-gray-400">หน้า {page} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                >
                  ถัดไป →
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="ยืนยันการลบ"
        footer={
          <div className="flex space-x-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ลบ
            </button>
          </div>
        }
      >
        <p className="text-gray-300">คุณต้องการลบครุภัณฑ์นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
