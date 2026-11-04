'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import ModeratorsManager from '@/components/admin/ModeratorsManager';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function DedicatedModeratorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/admin/login?redirect=/admin/moderators');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.authenticated || !data?.user) {
          router.replace('/admin/login?redirect=/admin/moderators');
          return;
        }

        // Only Super Admin can access the moderator management page
        if (!data.user.isSuperAdmin) {
          router.replace('/admin/403?required=users.manage&from=/admin/moderators');
          return;
        }

        setCurrentUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.replace('/admin/login?redirect=/admin/moderators');
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-xs font-bangla text-slate-400">সুপার এডমিন অনুমতি যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <AdminShell
      activeTab="moderators"
      onTabChange={(tab) => {
        if (tab === 'moderators') return;
        router.push(tab === 'dashboard' ? '/admin' : `/admin?tab=${tab}`);
      }}
      searchQuery=""
      onSearchChange={() => {}}
      onLogout={handleLogout}
      isSuperAdmin={currentUser?.isSuperAdmin}
      userPermissions={currentUser?.permissions}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ModeratorsManager />
      </div>
    </AdminShell>
  );
}
