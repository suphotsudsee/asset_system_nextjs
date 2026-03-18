'use client';

import Link from 'next/link';
import { usePublicQrBaseUrl } from '@/lib/public-qr-base-url';

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

interface AssetCardProps {
  asset: Asset;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const assetImage = asset.image ?? asset.imageData ?? null;
  const publicQrBaseUrl = usePublicQrBaseUrl();
  const qrImageUrl = `/api/qr/${asset.id}/image?rev=offline-v2${publicQrBaseUrl ? `&baseUrl=${encodeURIComponent(publicQrBaseUrl)}` : ''}`;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    disposed: 'bg-red-500',
    maintenance: 'bg-yellow-500',
  };

  const conditionColors: Record<string, string> = {
    excellent: 'bg-green-600',
    good: 'bg-blue-600',
    fair: 'bg-yellow-600',
    poor: 'bg-red-600',
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-56 overflow-hidden bg-gray-700 relative">
        {assetImage ? (
          <img
            src={assetImage}
            alt={asset.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
            <p className="text-gray-400 text-sm">{asset.assetCode}</p>
          </div>
          <div className="flex space-x-2">
            <span
              className={`px-2 py-1 rounded text-xs text-white ${statusColors[asset.status] || 'bg-gray-500'}`}
            >
              {asset.status}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs text-white ${conditionColors[asset.condition] || 'bg-gray-500'}`}
            >
              {asset.condition}
            </span>
          </div>
        </div>

        {asset.description && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{asset.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs">ราคาซื้อ</p>
            <p className="text-white font-medium">฿{asset.purchasePrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">หน่วยงาน</p>
            <p className="text-white font-medium">{asset.department || '-'}</p>
          </div>
        </div>

        <div className="mb-4">
          <Link
            href={`/assets/${asset.id}`}
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center text-sm"
          >
            ดูรายละเอียด
          </Link>
        </div>

        {/* QR Code Preview */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-400 text-xs mb-2">QR Code</p>
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-white rounded p-1">
              <a href={qrImageUrl} target="_blank" className="block">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100"/></svg>';
                  }}
                />
              </a>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-xs">สแกนเพื่อดูข้อมูลครุภัณฑ์</p>
              <a
                href={`/api/qr/${asset.id}/download`}
                download
                className="text-blue-400 text-xs hover:underline"
              >
                ดาวน์โหลด QR →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
