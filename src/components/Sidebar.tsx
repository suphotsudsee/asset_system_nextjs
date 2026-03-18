'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/assets', label: 'ครุภัณฑ์', icon: '📦' },
  { href: '/depreciation', label: 'ค่าเสื่อมราคา', icon: '💰' },
  { href: '/maintenance', label: 'การบำรุงรักษา', icon: '🔧' },
  { href: '/qr-scanner', label: 'สแกน QR', icon: '📷' },
  { href: '/reports', label: 'รายงาน', icon: '📈' },
  { href: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Asset System</h1>
          <p className="text-gray-400 text-sm mt-1">ระบบทะเบียนครุภัณฑ์</p>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                pathname === item.href ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onClose()}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
