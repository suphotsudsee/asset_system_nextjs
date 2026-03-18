'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Toast from '../../../components/Toast';

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

interface AssetFormData {
  assetCode: string;
  name: string;
  description: string;
  categoryId: number;
  serialNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: string;
  location: string;
  departmentId: number;
  status: string;
  condition: string;
  imageData: string;
}

const initialFormData: AssetFormData = {
  assetCode: '',
  name: '',
  description: '',
  categoryId: 1,
  serialNumber: '',
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  usefulLifeYears: 5,
  salvageValue: 0,
  depreciationMethod: 'straight_line',
  location: '',
  departmentId: 1,
  status: 'active',
  condition: 'good',
  imageData: '',
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = originalDataUrl;
  });

  const maxDimension = 100;
  const width = 400;
  const height = 400;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  // Center crop and resize to 100x100
  const minSide = Math.min(image.width, image.height);
  const sx = (image.width - minSide) / 2;
  const sy = (image.height - minSide) / 2;
  context.drawImage(image, sx, sy, minSide, minSide, 0, 0, width, height);

  let quality = 0.82;
  let optimized = canvas.toDataURL('image/jpeg', quality);

  while (optimized.length > 50_000 && quality > 0.45) {
    quality -= 0.08;
    optimized = canvas.toDataURL('image/jpeg', quality);
  }

  return optimized.length < originalDataUrl.length ? optimized : originalDataUrl;
}

export default function AddAssetPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void fetchCategories();
    void fetchDepartments();
  }, [router]);

  const updateFormData = <K extends keyof AssetFormData>(field: K, value: AssetFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;

      const data = await res.json();
      setCategories(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
      }
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) return;

      const data = await res.json();
      setDepartments(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
      }
    } catch {
      console.error('Failed to fetch departments');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);

    try {
      const imageData = await optimizeImage(file);
      setFormData((prev) => ({ ...prev, imageData }));
    } catch {
      setToast({ message: 'ไม่สามารถเตรียมรูปภาพได้', type: 'error' });
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageLoading) {
      setToast({ message: 'กรุณารอให้ระบบเตรียมรูปภาพก่อนบันทึก', type: 'info' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ message: 'เพิ่มครุภัณฑ์สำเร็จ', type: 'success' });
        setTimeout(() => router.push('/assets'), 1200);
      } else {
        setToast({ message: data.error || 'เพิ่มครุภัณฑ์ไม่สำเร็จ', type: 'error' });
      }
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="p-6">
          <h1 className="mb-6 text-3xl font-bold text-white">เพิ่มครุภัณฑ์ใหม่</h1>

          <form onSubmit={handleSubmit} className="max-w-3xl rounded-lg bg-gray-800 p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-gray-300">รหัสครุภัณฑ์ *</label>
                <input
                  type="text"
                  required
                  value={formData.assetCode}
                  onChange={(e) => updateFormData('assetCode', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">ชื่อครุภัณฑ์ *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-gray-300">คำอธิบาย</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">หมวดหมู่ *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => updateFormData('categoryId', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">เลขซีเรียล</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => updateFormData('serialNumber', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">ราคาซื้อ *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => updateFormData('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">วันที่ซื้อ *</label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => updateFormData('purchaseDate', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">อายุการใช้งาน (ปี) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.usefulLifeYears}
                  onChange={(e) => updateFormData('usefulLifeYears', parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">มูลค่าซาก</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salvageValue}
                  onChange={(e) => updateFormData('salvageValue', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">วิธีคำนวณค่าเสื่อม</label>
                <select
                  value={formData.depreciationMethod}
                  onChange={(e) => updateFormData('depreciationMethod', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="straight_line">เส้นตรง</option>
                  <option value="declining_balance">ยอดลดลงทวีคูณ</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">หน่วยงาน</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => updateFormData('departmentId', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">สถานที่</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                  <option value="maintenance">บำรุงรักษา</option>
                  <option value="disposed">จำหน่าย</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">สภาพ</label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="excellent">ดีมาก</option>
                  <option value="good">ดี</option>
                  <option value="fair">ปานกลาง</option>
                  <option value="poor">แย่</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-gray-300">รูปภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                />
                <p className="mt-2 text-xs text-gray-400">ระบบจะย่อรูปอัตโนมัติก่อนบันทึกเพื่อลดปัญหาขนาดไฟล์ใหญ่เกินไป</p>
                {imageLoading && <p className="mt-3 text-sm text-blue-300">กำลังเตรียมรูปภาพ...</p>}
                {formData.imageData && (
                  <img src={formData.imageData} alt="Preview" className="mt-4 max-h-48 rounded border border-gray-700" />
                )}
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                type="submit"
                disabled={loading || imageLoading}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : imageLoading ? 'กำลังเตรียมรูปภาพ...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/assets')}
                className="rounded-lg bg-gray-700 px-6 py-3 text-white transition-colors hover:bg-gray-600"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
