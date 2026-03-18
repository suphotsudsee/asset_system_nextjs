'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Toast from '../../../components/Toast';

interface AssetCategory {
  id: number;
  name: string;
  code: string;
}

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  category?: AssetCategory | null;
  serialNumber?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  usefulLifeYears?: number | null;
  salvageValue: number;
  depreciationMethod: string;
  location?: string | null;
  departmentId?: number | null;
  department?: { id: number; name: string; code: string } | null;
  status: string;
  condition: string;
  image?: string | null;
  imageData?: string | null;
  qrCodePath?: string | null;
}

function getAssetImage(target?: Partial<Asset> | null) {
  return target?.imageData ?? target?.image ?? null;
}

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

export default function AssetDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    void fetchAsset();
  }, [router]);

  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${params.id}`);
      if (!res.ok) return;

      const data = await res.json();
      setAsset(data);
      setFormData(data);
    } catch {
      console.error('Failed to fetch asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (imageLoading) {
      setToast({ message: 'กรุณารอให้ระบบเตรียมรูปภาพก่อนบันทึก', type: 'info' });
      return;
    }

    try {
      const payload = { ...formData };
      // Ensure image data is sent correctly
      if (payload.imageData && !payload.image) {
        payload.image = payload.imageData;
      }

      const res = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ message: 'บันทึกสำเร็จ', type: 'success' });
        setEditMode(false);
        await fetchAsset();
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'บันทึกไม่สำเร็จ', type: 'error' });
      }
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);

    try {
      const imageData = await optimizeImage(file);
      setFormData((prev) => ({ ...prev, image: imageData, imageData }));
    } catch {
      setToast({ message: 'ไม่สามารถเตรียมรูปภาพได้', type: 'error' });
    } finally {
      setImageLoading(false);
    }
  };

  if (loading || !asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-400">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">รายละเอียดครุภัณฑ์</h1>
            <div className="flex space-x-4">
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData(asset);
                    }}
                    className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={imageLoading}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {imageLoading ? 'กำลังเตรียมรูปภาพ...' : 'บันทึก'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  แก้ไข
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-gray-300">รหัสครุภัณฑ์</label>
                  <input
                    type="text"
                    value={formData.assetCode ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assetCode: e.target.value }))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-gray-300">ชื่อ</label>
                  <input
                    type="text"
                    value={formData.name ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-gray-300">คำอธิบาย</label>
                  <textarea
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-gray-300">รูปภาพครุภัณฑ์</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                  />
                  <p className="mt-2 text-xs text-gray-400">ระบบจะย่อรูปอัตโนมัติก่อนบันทึก</p>
                  {imageLoading && <p className="mt-3 text-sm text-blue-300">กำลังเตรียมรูปภาพ...</p>}
                  {getAssetImage(formData) && (
                    <img
                      src={getAssetImage(formData) ?? ''}
                      alt="Asset preview"
                      className="mt-4 max-h-56 rounded-lg border border-gray-600 object-cover"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-gray-300">ราคาซื้อ</label>
                    <input
                      type="number"
                      value={formData.purchasePrice ?? 0}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-gray-300">วันที่ซื้อ</label>
                    <input
                      type="date"
                      value={formData.purchaseDate?.split('T')[0] ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-gray-300">อายุการใช้งาน (ปี)</label>
                    <input
                      type="number"
                      value={formData.usefulLifeYears ?? 0}
                      onChange={(e) => setFormData((prev) => ({ ...prev, usefulLifeYears: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-gray-300">มูลค่าซาก</label>
                    <input
                      type="number"
                      value={formData.salvageValue ?? 0}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salvageValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-gray-300">สถานะ</label>
                    <select
                      value={formData.status ?? 'active'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
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
                      value={formData.condition ?? 'good'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white"
                    >
                      <option value="excellent">ดีมาก</option>
                      <option value="good">ดี</option>
                      <option value="fair">ปานกลาง</option>
                      <option value="poor">แย่</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">รหัสครุภัณฑ์</p>
                    <p className="font-medium text-white">{asset.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ชื่อ</p>
                    <p className="font-medium text-white">{asset.name}</p>
                  </div>
                </div>

                {asset.category?.name && (
                  <div>
                    <p className="text-sm text-gray-400">หมวดหมู่</p>
                    <p className="font-medium text-white">{asset.category.name}</p>
                  </div>
                )}

                {asset.description && (
                  <div>
                    <p className="text-sm text-gray-400">คำอธิบาย</p>
                    <p className="text-white">{asset.description}</p>
                  </div>
                )}

                {getAssetImage(asset) && (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">รูปภาพครุภัณฑ์</p>
                    <img
                      src={getAssetImage(asset) ?? ''}
                      alt={asset.name}
                      className="w-full max-w-xl rounded-lg border border-gray-700 object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">ราคาซื้อ</p>
                    <p className="font-medium text-white">฿{(asset.purchasePrice ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">วันที่ซื้อ</p>
                    <p className="font-medium text-white">
                      {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('th-TH') : '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">อายุการใช้งาน</p>
                    <p className="font-medium text-white">{asset.usefulLifeYears ?? '-'} ปี</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">มูลค่าซาก</p>
                    <p className="font-medium text-white">฿{asset.salvageValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">วิธีคิดค่าเสื่อม</p>
                    <p className="font-medium text-white">{asset.depreciationMethod}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">สถานะ</p>
                    <p className="font-medium text-white">{asset.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">สภาพ</p>
                    <p className="font-medium text-white">{asset.condition}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push('/assets')}
              className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
            >
              กลับ
            </button>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
