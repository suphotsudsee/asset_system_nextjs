'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
  fullName?: string | null;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            className="lg:hidden mr-4 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <h2 className="text-xl font-semibold">ระบบทะเบียนครุภัณฑ์</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-medium">{user.fullName || user.username}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
            >
              {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl z-50">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
