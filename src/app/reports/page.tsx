'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Toast from '../../components/Toast';

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate ? { start: startDate } : {}),
        ...(endDate ? { end: endDate } : {}),
      });
      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setToast({ message: 'สร้างรายงานสำเร็จ', type: 'success' });
      } else {
        setToast({ message: 'สร้างรายงานไม่สำเร็จ', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (value: unknown) => {
    if (value == null) return '';
    if (typeof value === 'object') {
      if ('name' in (value as Record<string, unknown>)) {
        return String((value as { name?: unknown }).name ?? '');
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const exportCSV = () => {
    if (!reportData) return;
    const headers = Object.keys(reportData[0] || {}).join(',');
    const rows = reportData
      .map((row: any) => Object.values(row).map((value) => formatCellValue(value)).join(','))
      .join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setToast({ message: 'ดาวน์โหลด CSV สำเร็จ', type: 'success' });
  };

  const reportTypes = [
    { value: 'summary', label: 'สรุปครุภัณฑ์ทั้งหมด' },
    { value: 'category', label: 'ตามหมวดหมู่' },
    { value: 'department', label: 'ตามหน่วยงาน' },
    { value: 'status', label: 'ตามสถานะ' },
    { value: 'depreciation', label: 'ค่าเสื่อมราคา' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <h1 className="text-3xl font-bold text-white mb-6">รายงาน</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">ตัวเลือก</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">ประเภทรายงาน</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {reportTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                </button>
                {reportData && (
                  <button
                    onClick={exportCSV}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📥 ดาวน์โหลด CSV
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">ผลลัพธ์</h2>
              {reportData ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        {Object.keys(reportData[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-gray-300">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {reportData.map((row: any, i: number) => (
                        <tr key={i}>
                          {Object.keys(row).map((key) => (
                            <td key={key} className="px-4 py-2 text-white">{formatCellValue(row[key])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400">เลือกตัวเลือกและกดสร้างรายงาน</div>
              )}
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
