'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Modal from '../../../components/Modal';
import Toast from '../../../components/Toast';

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
}

export default function CategoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
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
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ 
          message: editingCategory ? 'อัปเดตหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ', 
          type: 'success' 
        });
        setModalOpen(false);
        fetchCategories();
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'ไม่สำเร็จ', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await fetch(`/api/categories/${categoryToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'ลบหมวดหมู่สำเร็จ', type: 'success' });
        fetchCategories();
      } else {
        setToast({ message: 'ลบไม่สำเร็จ', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">หมวดหมู่ครุภัณฑ์</h1>
              <p className="text-gray-400 mt-1">จัดการประเภท/หมวดหมู่ครุภัณฑ์</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ เพิ่มหมวดหมู่
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
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{category.code}</td>
                      <td className="px-6 py-4 text-white">{category.name}</td>
                      <td className="px-6 py-4 text-gray-400">{category.description || '-'}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(category.createdAt).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openModal(category)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category.id);
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
              {categories.length === 0 && (
                <div className="text-center text-gray-400 py-12">ไม่มีหมวดหมู่</div>
              )}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
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
              {editingCategory ? 'อัปเดต' : 'บันทึก'}
            </button>
          </div>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">รหัสหมวดหมู่ *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="CAT-001"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">ชื่อหมวดหมู่ *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="คอมพิวเตอร์และอุปกรณ์"
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
        <p className="text-gray-300">คุณต้องการลบหมวดหมู่นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
