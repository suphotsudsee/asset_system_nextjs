'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description?: string | null;
  image?: string | null;
  purchasePrice: number;
  status: string;
  condition: string;
  department?: string | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  disposed: 'bg-red-500',
  maintenance: 'bg-amber-400 text-gray-900',
};

const conditionColors: Record<string, string> = {
  excellent: 'bg-green-600',
  good: 'bg-blue-600',
  fair: 'bg-amber-400 text-gray-900',
  poor: 'bg-red-600',
};

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default function QRScanResultPage() {
  const params = useParams<{ id: string }>();
  const assetId = params.id;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;
    void fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/assets/${assetId}/public`);
      if (!res.ok) {
        setError('ไม่พบข้อมูลครุภัณฑ์');
        return;
      }

      const data = await res.json();
      setAsset(data);
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120]">
        <div className="text-sm text-slate-300">กำลังโหลดข้อมูลครุภัณฑ์...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120] p-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 text-center shadow-xl">
          <h1 className="mb-2 text-xl font-bold text-white">{error || 'ไม่พบข้อมูล'}</h1>
          <p className="mb-5 text-sm text-slate-300">ครุภัณฑ์นี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <Link href="/" className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] px-4 py-6">
      <div className="mx-auto max-w-[430px]">
        <div className="overflow-hidden rounded-2xl bg-slate-800 shadow-2xl ring-1 ring-white/5">
          <div className="h-56 bg-slate-900">
            {asset.image ? (
              <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-500">
                <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="bg-slate-800 px-4 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-[1.65rem] font-bold leading-tight text-white">{asset.name}</h1>
                <p className="mt-1 text-base text-slate-400">{asset.assetCode}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className={`rounded-md px-3 py-1 text-xs font-semibold capitalize text-white ${statusColors[asset.status] || 'bg-gray-500'}`}>
                  {formatLabel(asset.status)}
                </span>
                <span className={`rounded-md px-3 py-1 text-xs font-semibold capitalize text-white ${conditionColors[asset.condition] || 'bg-gray-500'}`}>
                  {formatLabel(asset.condition)}
                </span>
              </div>
            </div>

            {asset.description && (
              <p className="mb-5 text-lg text-slate-100">{asset.description}</p>
            )}

            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-slate-400">ราคาซื้อ</p>
                <p className="text-[2rem] font-bold leading-none text-white">฿{asset.purchasePrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-slate-400">หน่วยงาน</p>
                <p className="text-2xl font-bold leading-none text-white">{asset.department || '-'}</p>
              </div>
            </div>

            <Link
              href={`/assets/${asset.id}`}
              className="block rounded-xl bg-blue-600 px-4 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-700"
            >
              ดูรายละเอียด
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
