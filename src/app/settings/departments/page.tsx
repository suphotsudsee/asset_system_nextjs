'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Modal from '../../../components/Modal';
import Toast from '../../../components/Toast';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDepartment ? `/api/departments/${editingDepartment.id}` : '/api/departments';
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ 
          message: editingDepartment ? 'อัปเดตหน่วยงานสำเร็จ' : 'เพิ่มหน่วยงานสำเร็จ', 
          type: 'success' 
        });
        setModalOpen(false);
        fetchDepartments();
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'ไม่สำเร็จ', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    try {
      const res = await fetch(`/api/departments/${departmentToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'ลบหน่วยงานสำเร็จ', type: 'success' });
        fetchDepartments();
      } else {
        setToast({ message: 'ลบไม่สำเร็จ', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
    setDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">หน่วยงาน</h1>
              <p className="text-gray-400 mt-1">จัดการหน่วยงาน/กรม/กอง</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ เพิ่มหน่วยงาน
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-300">รหัส</th>
                    <th className="px-6 py-3 text-left text-gray-300">ชื่อ</th>
                    <th className="px-6 py-3 text-left text-gray-300">คำอธิบาย</th>
                    <th className="px-6 py-3 text-left text-gray-300">สร้างเมื่อ</th>
                    <th className="px-6 py-3 text-right text-gray-300">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{dept.code}</td>
                      <td className="px-6 py-4 text-white">{dept.name}</td>
                      <td className="px-6 py-4 text-gray-400">{dept.description || '-'}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(dept.createdAt).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openModal(dept)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => {
                              setDepartmentToDelete(dept.id);
                              setDeleteModalOpen(true);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {departments.length === 0 && (
                <div className="text-center text-gray-400 py-12">ไม่มีหน่วยงาน</div>
              )}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDepartment ? 'แก้ไขหน่วยงาน' : 'เพิ่มหน่วยงาน'}
        footer={
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingDepartment ? 'อัปเดต' : 'บันทึก'}
            </button>
          </div>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">รหัสหน่วยงาน *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="DEPT-001"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ชื่อหน่วยงาน *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="สำนักงานจังหวัด"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">คำอธิบาย</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
        </form>
      </Modal>

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
        <p className="text-gray-300">คุณต้องการลบหน่วยงานนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
