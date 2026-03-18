'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import Toast from '../../../../components/Toast';
import { useAppLanguage } from '../../../../lib/language';

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

interface AssetResponse {
  id: number;
  assetCode: string;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  serialNumber?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  usefulLifeYears?: number | null;
  salvageValue?: number | null;
  depreciationMethod?: string | null;
  location?: string | null;
  departmentId?: number | null;
  status?: string | null;
  condition?: string | null;
  imageData?: string | null;
  image?: string | null;
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
  categoryId: 0,
  serialNumber: '',
  purchasePrice: 0,
  purchaseDate: '',
  usefulLifeYears: 5,
  salvageValue: 0,
  depreciationMethod: 'straight_line',
  location: '',
  departmentId: 0,
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

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  const minSide = Math.min(image.width, image.height);
  const sx = (image.width - minSide) / 2;
  const sy = (image.height - minSide) / 2;
  context.drawImage(image, sx, sy, minSide, minSide, 0, 0, 400, 400);

  let quality = 0.82;
  let optimized = canvas.toDataURL('image/jpeg', quality);

  while (optimized.length > 50_000 && quality > 0.45) {
    quality -= 0.08;
    optimized = canvas.toDataURL('image/jpeg', quality);
  }

  return optimized.length < originalDataUrl.length ? optimized : originalDataUrl;
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
}

export default function EditAssetPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { language } = useAppLanguage();

  const updateFormData = <K extends keyof AssetFormData>(field: K, value: AssetFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchReferenceData = useCallback(async () => {
    const [categoriesRes, departmentsRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/departments'),
    ]);

    if (categoriesRes.ok) {
      const categoriesData: Category[] = await categoriesRes.json();
      setCategories(categoriesData);
    }

    if (departmentsRes.ok) {
      const departmentsData: Department[] = await departmentsRes.json();
      setDepartments(departmentsData);
    }
  }, []);

  const fetchAsset = useCallback(async () => {
    const res = await fetch(`/api/assets/${params.id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch asset');
    }

    const asset: AssetResponse = await res.json();
    setFormData({
      assetCode: asset.assetCode ?? '',
      name: asset.name ?? '',
      description: asset.description ?? '',
      categoryId: asset.categoryId ?? 0,
      serialNumber: asset.serialNumber ?? '',
      purchasePrice: asset.purchasePrice ?? 0,
      purchaseDate: toDateInputValue(asset.purchaseDate),
      usefulLifeYears: asset.usefulLifeYears ?? 5,
      salvageValue: asset.salvageValue ?? 0,
      depreciationMethod: asset.depreciationMethod ?? 'straight_line',
      location: asset.location ?? '',
      departmentId: asset.departmentId ?? 0,
      status: asset.status ?? 'active',
      condition: asset.condition ?? 'good',
      imageData: asset.imageData ?? asset.image ?? '',
    });
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const loadPage = async () => {
      try {
        await Promise.all([fetchReferenceData(), fetchAsset()]);
      } catch {
        setToast({ message: 'Failed to load asset data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [fetchAsset, fetchReferenceData, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);

    try {
      const imageData = await optimizeImage(file);
      setFormData((prev) => ({ ...prev, imageData }));
    } catch {
      setToast({ message: 'Failed to process image', type: 'error' });
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageLoading) {
      setToast({ message: 'Please wait for image processing to finish', type: 'info' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Failed to update asset', type: 'error' });
        return;
      }

      setToast({ message: 'Asset updated successfully', type: 'success' });
      setTimeout(() => router.push(`/assets/${params.id}`), 900);
    } catch {
      setToast({ message: 'Unexpected error while saving asset', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#252525] text-zinc-400">
        Loading asset editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="px-6 pb-8 pt-4 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => router.push(`/assets/${params.id}`)}
                className="mb-3 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Back to asset details
              </button>
              <h1 className="text-4xl font-black tracking-tight">Edit Asset</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl bg-[#1d1d1d] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Asset Code</label>
                <input
                  type="text"
                  required
                  value={formData.assetCode}
                  onChange={(e) => updateFormData('assetCode', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => updateFormData('categoryId', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value={0} disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => updateFormData('serialNumber', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Purchase Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => updateFormData('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Purchase Date</label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => updateFormData('purchaseDate', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Useful Life (Years)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.usefulLifeYears}
                  onChange={(e) => updateFormData('usefulLifeYears', parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Salvage Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salvageValue}
                  onChange={(e) => updateFormData('salvageValue', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  {language === 'th' ? 'วิธีคิดค่าเสื่อมราคา' : 'Depreciation Method'}
                </label>
                <select
                  value={formData.depreciationMethod}
                  onChange={(e) => updateFormData('depreciationMethod', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="straight_line">{language === 'th' ? 'เส้นตรง' : 'Straight Line'}</option>
                  <option value="declining_balance">{language === 'th' ? 'ยอดลดลง' : 'Declining Balance'}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => updateFormData('departmentId', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value={0} disabled>
                    Select department
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">Asset Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full rounded-lg border border-white/5 bg-[#2d2d2d] px-4 py-3 text-white"
                />
                <p className="mt-2 text-xs text-zinc-500">Uploaded images are automatically optimized before saving.</p>
                {imageLoading && <p className="mt-3 text-sm text-indigo-300">Processing image...</p>}
                {formData.imageData && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.imageData} alt="Asset preview" className="mt-4 max-h-56 rounded-xl border border-white/10" />
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={saving || imageLoading}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : imageLoading ? 'Processing image...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/assets/${params.id}`)}
                className="rounded-lg bg-[#2d2d2d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#383838]"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
