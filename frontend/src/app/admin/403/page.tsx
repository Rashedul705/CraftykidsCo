'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const required = searchParams.get('required');
  const from = searchParams.get('from');
  const { user } = usePermission();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 rounded-full mb-3 border border-red-500/30">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-bold text-white mb-2 font-bangla">
          প্রবেশাধিকার সংরক্ষিত
        </h1>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          আপনার বর্তমান মডারেটর অ্যাকাউন্টের এই পেজ অথবা অপশনে প্রবেশের অনুমতি নেই।
        </p>

        {(required || from) && (
          <div className="bg-slate-900/80 rounded-xl p-3.5 mb-6 text-left border border-slate-700 text-xs text-slate-400 font-mono space-y-1.5">
            {from && (
              <div>
                <span className="text-slate-500">Attempted Route: </span>
                <span className="text-slate-200">{from}</span>
              </div>
            )}
            {required && (
              <div>
                <span className="text-slate-500">Required Permission: </span>
                <span className="text-amber-400 font-semibold">{required}</span>
              </div>
            )}
            {user && (
              <div>
                <span className="text-slate-500">Signed In As: </span>
                <span className="text-slate-300">{user.email} ({user.role})</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <Home className="w-4 h-4" />
            এডমিন ড্যাশবোর্ডে ফিরে যান
          </Link>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            প্রয়োজনে অনুগ্রহ করে সুপার এডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}

