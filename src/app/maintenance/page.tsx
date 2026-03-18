'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

interface Maintenance {
  id: number;
  assetId: number;
  maintenanceType: string;
  title: string;
  description?: string | null;
  priority: string;
  scheduledDate?: string | null;
  completedDate?: string | null;
  dueDate?: string | null;
  status: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  technicianName?: string | null;
  asset?: {
    assetCode: string;
    name: string;
  };
}

export default function MaintenancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    assetId: 1,
    maintenanceType: 'preventive',
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    dueDate: '',
    status: 'pending',
    laborCost: 0,
    partsCost: 0,
    technicianName: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        setMaintenances(data);
      }
    } catch (e) {
      console.error('Failed to fetch maintenances');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setToast({ message: 'สร้างรอบำรุงรักษาสำเร็จ', type: 'success' });
        setCreateModalOpen(false);
        fetchMaintenances();
        setFormData({
          assetId: 1,
          maintenanceType: 'preventive',
          title: '',
          description: '',
          priority: 'medium',
          scheduledDate: '',
          dueDate: '',
          status: 'pending',
          laborCost: 0,
          partsCost: 0,
          technicianName: '',
        });
      } else {
        setToast({ message: 'สร้างไม่สำเร็จ', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-600',
    medium: 'bg-yellow-600',
    high: 'bg-orange-600',
    critical: 'bg-red-600',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-600',
    in_progress: 'bg-blue-600',
    completed: 'bg-green-600',
    cancelled: 'bg-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">การบำรุงรักษา</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ สร้างใหม่
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-300">ครุภัณฑ์</th>
                    <th className="px-6 py-3 text-left text-gray-300">หัวข้อ</th>
                    <th className="px-6 py-3 text-left text-gray-300">ประเภท</th>
                    <th className="px-6 py-3 text-left text-gray-300">ความสำคัญ</th>
                    <th className="px-6 py-3 text-left text-gray-300">สถานะ</th>
                    <th className="px-6 py-3 text-left text-gray-300">กำหนด</th>
                    <th className="px-6 py-3 text-right text-gray-300">ค่าใช้จ่าย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {maintenances.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {m.asset?.assetCode} - {m.asset?.name}
                      </td>
                      <td className="px-6 py-4 text-white">{m.title}</td>
                      <td className="px-6 py-4 text-white">{m.maintenanceType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs text-white ${priorityColors[m.priority]}`}>
                          {m.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs text-white ${statusColors[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        ฿{m.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="สร้างรอบำรุงรักษา"
        footer={
          <div className="flex space-x-4">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              สร้าง
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">ครุภัณฑ์</label>
            <select
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value={1}>เลือกครุภัณฑ์</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">หัวข้อ</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ประเภท</label>
            <select
              value={formData.maintenanceType}
              onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="preventive">ป้องกัน</option>
              <option value="corrective">แก้ไข</option>
              <option value="predictive">พยากรณ์</option>
              <option value="emergency">ฉุกเฉิน</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ความสำคัญ</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
              <option value="critical">วิกฤต</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">วันที่กำหนด</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ค่าใช้จ่ายแรงงาน</label>
            <input
              type="number"
              value={formData.laborCost}
              onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ค่าใช้จ่ายอะไหล่</label>
            <input
              type="number"
              value={formData.partsCost}
              onChange={(e) => setFormData({ ...formData, partsCost: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
