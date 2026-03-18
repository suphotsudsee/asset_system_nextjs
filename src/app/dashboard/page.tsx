'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Link from 'next/link';

interface Stats {
  totalAssets: number;
  activeAssets: number;
  totalValue: number;
  maintenancePending: number;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'ครุภัณฑ์ทั้งหมด', value: stats?.totalAssets ?? 0, icon: '📦', color: 'blue' },
    { title: 'ใช้งานอยู่', value: stats?.activeAssets ?? 0, icon: '✅', color: 'green' },
    { title: 'มูลค่ารวม', value: `฿${(stats?.totalValue ?? 0).toLocaleString()}`, icon: '💰', color: 'yellow' },
    { title: 'รอบำรุงรักษา', value: stats?.maintenancePending ?? 0, icon: '🔧', color: 'red' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

          {loading ? (
            <div className="text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((card, i) => (
                <div
                  key={i}
                  className={`bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 border-${card.color}-500`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{card.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                    </div>
                    <span className="text-4xl">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">เมนูด่วน</h2>
              <div className="space-y-3">
                <Link href="/assets/add" className="block px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  ➕ เพิ่มครุภัณฑ์ใหม่
                </Link>
                <Link href="/assets" className="block px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                  📋 ดูครุภัณฑ์ทั้งหมด
                </Link>
                <Link href="/reports" className="block px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                  📈 สร้างรายงาน
                </Link>
                <Link href="/qr-scanner" className="block px-4 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                  📷 สแกน QR Code
                </Link>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">สถานะล่าสุด</h2>
              <div className="space-y-3 text-gray-300">
                <p>• ระบบพร้อมใช้งาน</p>
                <p>• รองรับ 5 บทบาทผู้ใช้</p>
                <p>• บันทึก Audit Log อัตโนมัติ</p>
                <p>• คำนวณค่าเสื่อมราคา 2 วิธี</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
