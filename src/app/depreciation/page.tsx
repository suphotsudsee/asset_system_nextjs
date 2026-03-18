'use client';

import { useState, useEffect } from 'react';
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

export default function DepreciationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchDepreciations();
  }, [page, rowsPerPage]);

  const fetchDepreciations = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });
      const res = await fetch(`/api/depreciation?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDepreciations(data.depreciations);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('Failed to fetch depreciations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (assetId: number) => {
    try {
      const res = await fetch(`/api/depreciation/${assetId}/schedule`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.schedule || []);
        setSelectedAssetInfo(data.asset);
        setScheduleModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch schedule');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <h1 className="text-3xl font-bold text-white mb-6">ค่าเสื่อมราคา</h1>

          {loading ? (
            <div className="text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-300">ครุภัณฑ์</th>
                    <th className="px-6 py-3 text-left text-gray-300">ปี fiskal</th>
                    <th className="px-6 py-3 text-right text-gray-300">มูลค่าต้นปี</th>
                    <th className="px-6 py-3 text-right text-gray-300">ค่าเสื่อม</th>
                    <th className="px-6 py-3 text-right text-gray-300">ค่าเสื่อมสะสม</th>
                    <th className="px-6 py-3 text-right text-gray-300">มูลค่าปลายปี</th>
                    <th className="px-6 py-3 text-left text-gray-300">วิธี</th>
                    <th className="px-6 py-3 text-left text-gray-300">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {depreciations.map((dep) => (
                    <tr key={dep.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {dep.asset?.assetCode} - {dep.asset?.name}
                      </td>
                      <td className="px-6 py-4 text-white">{dep.fiscalYear}</td>
                      <td className="px-6 py-4 text-right text-white">฿{dep.beginningBookValue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-white">฿{dep.depreciationExpense.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-white">฿{dep.accumulatedDepreciation.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-white">฿{dep.endingBookValue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-white">{dep.depreciationMethod}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchSchedule(dep.assetId)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          ดูตาราง
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-700 border-t border-gray-600">
                <div className="flex items-center space-x-4">
                  <label className="text-gray-300 text-sm">แสดง:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-gray-300 text-sm">รายการต่อหน้า</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">
                    หน้า {page} / {Math.ceil(total / rowsPerPage)} (ทั้งหมด {total} รายการ)
                  </span>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    ← ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(total / rowsPerPage), page + 1))}
                    disabled={page >= Math.ceil(total / rowsPerPage)}
                    className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    ถัดไป →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={
          <div>
            <h3 className="text-xl font-bold text-white">ตารางค่าเสื่อมราคา</h3>
            {selectedAssetInfo && (
              <p className="text-gray-400 mt-1">
                {selectedAssetInfo.assetCode} - {selectedAssetInfo.name}
              </p>
            )}
          </div>
        }
        footer={
          <button
            onClick={() => setScheduleModalOpen(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        }
      >
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">ปี</th>
                <th className="px-4 py-2 text-right text-gray-300">ค่าเสื่อม</th>
                <th className="px-4 py-2 text-right text-gray-300">สะสม</th>
                <th className="px-4 py-2 text-right text-gray-300">มูลค่าคงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {schedule.map((row, i) => (
                <tr key={i} className="hover:bg-gray-700">
                  <td className="px-4 py-2 text-white">{row.year}</td>
                  <td className="px-4 py-2 text-right text-white">฿{row.depreciationExpense.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-white">฿{row.accumulatedDepreciation.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-white">฿{row.endingBookValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
