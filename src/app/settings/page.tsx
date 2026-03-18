'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Link from 'next/link';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
  }, []);

  const menuItems = [
    {
      id: 'departments',
      title: 'หน่วยงาน',
      description: 'จัดการหน่วยงาน/กรม/กอง',
      icon: '🏢',
      href: '/settings/departments',
    },
    {
      id: 'categories',
      title: 'หมวดหมู่ครุภัณฑ์',
      description: 'จัดการประเภท/หมวดหมู่ครุภัณฑ์',
      icon: '📦',
      href: '/settings/categories',
    },
    {
      id: 'users',
      title: 'ผู้ใช้งาน',
      description: 'จัดการผู้ใช้และสิทธิ์',
      icon: '👥',
      href: '/settings/users',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header />
        
        <main className="p-6">
          <h1 className="text-3xl font-bold text-white mb-6">ตั้งค่าระบบ</h1>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow block"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 mb-4">{item.description}</p>
                <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  จัดการ →
                </span>
              </Link>
            ))}
          </div>

          {/* Quick Info */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">ℹ️ ข้อมูลระบบ</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">เวอร์ชัน</p>
                <p className="text-white">1.0.0</p>
              </div>
              <div>
                <p className="text-gray-400">ฐานข้อมูล</p>
                <p className="text-white">MySQL (localhost:3333)</p>
              </div>
              <div>
                <p className="text-gray-400">Prisma ORM</p>
                <p className="text-white">6.19.2</p>
              </div>
              <div>
                <p className="text-gray-400">Next.js</p>
                <p className="text-white">15+</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
