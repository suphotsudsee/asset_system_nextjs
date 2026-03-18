'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Toast from '../../components/Toast';
import { parseAssetQrPayload } from '@/lib/qr-payload';

function resolveScanTarget(decodedText: string) {
  const offlinePayload = parseAssetQrPayload(decodedText);
  if (offlinePayload) {
    return `/assets/${offlinePayload.assetId}`;
  }

  if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
    try {
      const url = new URL(decodedText);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return null;
    }
  }

  const assetId = decodedText.split('-').pop();
  return assetId ? `/assets/${assetId}` : null;
}

export default function QRScannerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  const stopScannerInstance = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
      await scanner.stop();
    }

    scanner.clear();
    scannerRef.current = null;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }

    return () => {
      void stopScannerInstance();
    };
  }, [router]);

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await stopScannerInstance();
      }

      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          setScanResult(decodedText);
          setScanning(false);
          setToast({ message: `สแกนสำเร็จ: ${decodedText}`, type: 'success' });
          await stopScannerInstance();

          const target = resolveScanTarget(decodedText);
          if (target) {
            router.push(target);
          }
        },
        () => {}
      );

      setScanning(true);
    } catch {
      scannerRef.current = null;
      setScanning(false);
      setToast({ message: 'ไม่สามารถเข้าถึงกล้องได้', type: 'error' });
    }
  };

  const stopScanner = async () => {
    try {
      await stopScannerInstance();
      setScanning(false);
    } catch {
      console.error('Failed to stop scanner');
    }
  };

  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get('code') || '').trim();
    if (!code) return;

    setScanResult(code);
    setToast({ message: `ค้นหา: ${code}`, type: 'success' });

    const target = resolveScanTarget(code);
    if (target) {
      router.push(target);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header />

        <main className="p-6">
          <h1 className="mb-6 text-3xl font-bold text-white">สแกน QR Code</h1>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold text-white">สแกนด้วยกล้อง</h2>
              <div id="reader" className="mb-4 overflow-hidden rounded bg-black" style={{ minHeight: '300px' }} />
              <div className="flex space-x-4">
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                  >
                    เริ่มสแกน
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
                  >
                    หยุดสแกน
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold text-white">หรือใส่รหัส/ลิงก์ด้วยตนเอง</h2>
              <form onSubmit={handleManualInput} className="space-y-4">
                <div>
                  <label className="mb-2 block text-gray-300">รหัสครุภัณฑ์ หรือ URL จาก QR</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="AST-2026-001 หรือ http://localhost:3001/qr/1"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
                >
                  เปิดข้อมูล
                </button>
              </form>

              {scanResult && (
                <div className="mt-6 rounded-lg bg-gray-700 p-4">
                  <p className="text-sm text-gray-400">ผลสแกน:</p>
                  <p className="break-all font-mono text-white">{scanResult}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">วิธีใช้</h2>
            <ul className="space-y-2 text-gray-300">
              <li>กด &quot;เริ่มสแกน&quot; เพื่อเปิดกล้อง</li>
              <li>เมื่อสแกน QR ที่เป็นลิงก์ ระบบจะเปิดหน้าการ์ดข้อมูลทันที</li>
              <li>ยังรองรับรหัสครุภัณฑ์แบบเดิมสำหรับค้นหาภายในระบบ</li>
            </ul>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
