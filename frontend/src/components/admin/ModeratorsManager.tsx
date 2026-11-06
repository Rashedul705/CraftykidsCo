'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  KeyRound,
  Filter,
} from 'lucide-react';
import {
  PERMISSION_GROUPS,
  PERMISSION_DEFINITIONS,
  PRESETS,
  enforcePermissionDependencies,
  PermissionGroup,
} from '@/lib/permissions';
import { usePermission } from '@/hooks/usePermission';

interface ModeratorItem {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLogItem {
  id: string;
  actorEmail: string;
  action: string;
  targetUserId?: string;
  details?: {
    name?: string;
    email?: string;
    oldPermissions?: string[];
    newPermissions?: string[];
    isActive?: boolean;
    reason?: string;
  };
  createdAt: string;
}

export default function ModeratorsManager() {
  const { isSuperAdmin } = usePermission();

  const [moderators, setModerators] = useState<ModeratorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Activity Log Drawer State
  const [showLogs, setShowLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Show Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Moderators
  const fetchModerators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/moderators');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'মডারেটর তালিকা লোড করতে ব্যর্থ হয়েছে');
      }
      setModerators(data.moderators || []);
    } catch (err: any) {
      setError(err.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/admin/activity-logs?limit=30');
      const data = await res.json();
      if (res.ok && data.success) {
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchModerators();
  }, [fetchModerators]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      isActive: true,
    });
    setSelectedPermissions([]);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (mod: ModeratorItem) => {
    setIsEditing(true);
    setCurrentId(mod.id);
    setFormData({
      name: mod.name || '',
      email: mod.email || '',
      password: '', // Blank unless modifying
      isActive: mod.isActive !== false,
    });
    setSelectedPermissions(mod.permissions || []);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  // Toggle Active Status Directly from Table
  const handleToggleActive = async (mod: ModeratorItem) => {
    try {
      const newStatus = !mod.isActive;
      const res = await fetch(`/api/admin/moderators/${mod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে');
      }
      showToast(
        newStatus ? 'মডারেটর অ্যাকাউন্ট সক্রিয় করা হয়েছে' : 'মডারেটর অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে'
      );
      fetchModerators();
    } catch (err: any) {
      showToast(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Delete Moderator
  const handleDeleteModerator = async (mod: ModeratorItem) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${mod.name || mod.email}" মডারেটর অ্যাকাউন্ট মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/moderators/${mod.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'মডারেটর মুছতে ব্যর্থ হয়েছে');
      }
      showToast('মডারেটর সফলভাবে মুছে ফেলা হয়েছে');
      fetchModerators();
    } catch (err: any) {
      showToast(err.message || 'ডিলিট করতে ত্রুটি ঘটেছে', 'error');
    }
  };

  // Apply Preset
  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const resolved = enforcePermissionDependencies(preset.permissions);
    setSelectedPermissions(resolved);
    showToast(`"${preset.nameBn}" প্রিসেট পারমিশন সফলভাবে যুক্ত করা হয়েছে`);
  };

  // Toggle Single Permission with Dependency Rules
  const handleTogglePermission = (key: string, group: PermissionGroup) => {
    const isCurrentlyChecked = selectedPermissions.includes(key);
    let next: string[] = [];

    if (isCurrentlyChecked) {
      // Unticking
      if (group.viewPermissionKey === key) {
        // Unticking "view" removes all other permissions in this group
        const groupKeys = new Set(group.permissions.map((p) => p.key));
        next = selectedPermissions.filter((k) => !groupKeys.has(k));
      } else {
        next = selectedPermissions.filter((k) => k !== key);
      }
    } else {
      // Ticking
      next = [...selectedPermissions, key];
      // If ticking edit/delete/manage, automatically ensure "view" in this group is ticked
      if (group.viewPermissionKey && !next.includes(group.viewPermissionKey)) {
        next.push(group.viewPermissionKey);
      }
    }

    setSelectedPermissions(enforcePermissionDependencies(next));
  };

  // Toggle All Permissions in a Group
  const handleToggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allGroupChecked = groupKeys.every((k) => selectedPermissions.includes(k));

    let next: string[] = [];
    if (allGroupChecked) {
      // Deselect entire group
      next = selectedPermissions.filter((k) => !groupKeys.includes(k));
    } else {
      // Select all in group
      next = Array.from(new Set([...selectedPermissions, ...groupKeys]));
    }
    setSelectedPermissions(enforcePermissionDependencies(next));
  };

  // Toggle Global Select All
  const assignableGroups = useMemo(
    () => PERMISSION_GROUPS,
    []
  );

  const allAssignableKeys = useMemo(
    () => assignableGroups.flatMap((g) => g.permissions.map((p) => p.key)),
    [assignableGroups]
  );

  const isAllSelected = useMemo(
    () => allAssignableKeys.length > 0 && allAssignableKeys.every((k) => selectedPermissions.includes(k)),
    [allAssignableKeys, selectedPermissions]
  );

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(enforcePermissionDependencies(allAssignableKeys));
    }
  };

  // Filtered Groups for Search
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return assignableGroups;

    return assignableGroups
      .map((group) => {
        const matchesGroup =
          group.name.toLowerCase().includes(q) ||
          group.nameBn.toLowerCase().includes(q) ||
          group.description.toLowerCase().includes(q);

        const matchingPermissions = group.permissions.filter(
          (p) =>
            p.key.toLowerCase().includes(q) ||
            p.label.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );

        if (matchesGroup) {
          return group;
        }

        if (matchingPermissions.length > 0) {
          return {
            ...group,
            permissions: matchingPermissions,
          };
        }

        return null;
      })
      .filter(Boolean) as PermissionGroup[];
  }, [assignableGroups, searchQuery]);

  // Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!isEditing && (!formData.email || !formData.password)) {
        throw new Error('ইমেইল ও পাসওয়ার্ড অবশ্যই পূরণ করতে হবে');
      }

      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        permissions: enforcePermissionDependencies(selectedPermissions),
        isActive: formData.isActive,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const url = isEditing ? `/api/admin/moderators/${currentId}` : '/api/admin/moderators';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'মডারেটর সংরক্ষণ করতে ব্যর্থ হয়েছে');
      }

      showToast(
        isEditing
          ? 'মডারেটর পারমিশন সফলভাবে আপডেট হয়েছে'
          : 'নতুন মডারেটর অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে'
      );
      setIsModalOpen(false);
      fetchModerators();
    } catch (err: any) {
      showToast(err.message || 'একটি ত্রুটি ঘটেছে', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all border ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/95 border-red-500/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-bangla">
                মডারেটর পারমিশন ও এক্সেস কন্ট্রোল
              </h2>
              <p className="text-xs text-slate-400">
                Customizable Permission System for Staff & Moderators
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
            সুপার এডমিন হিসেবে আপনি প্রতিটি মডারেটরকে সুনির্দিষ্ট ফিচার অ্যাক্সেস দিতে পারেন।
            অনুমতি পরিবর্তন করলে তা সাথে সাথে কার্যকর হবে (কোনো রি-লগইনের প্রয়োজন নেই)।
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) fetchLogs();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition border border-slate-600"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>অ্যাক্টিভিটি লগ</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন মডারেটর</span>
          </button>
        </div>
      </div>

      {/* Moderator List Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              সকল মডারেটর তালিকা ({moderators.length})
            </h3>
          </div>
          <button
            onClick={fetchModerators}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> রিফ্রেশ
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mb-2"></div>
            <p>মডারেটর তথ্য লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p>{error}</p>
          </div>
        ) : moderators.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-sm">
            <UserX className="w-10 h-10 mx-auto mb-2 text-slate-500" />
            <p className="font-bangla">কোনো মডারেটর অ্যাকাউন্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-1">
              নতুন মডারেটর যোগ করতে &quot;+ নতুন মডারেটর&quot; বাটনে ক্লিক করুন
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-700/50">
                <tr>
                  <th className="py-3 px-4">নাম ও ইমেইল</th>
                  <th className="py-3 px-4">রোল</th>
                  <th className="py-3 px-4">অনুমোদিত পারমিশন</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {moderators.map((mod) => {
                  const permCount = mod.permissions?.length || 0;
                  return (
                    <tr key={mod.id} className="hover:bg-slate-750/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{mod.name || 'Staff Member'}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{mod.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {mod.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              permCount === 0
                                ? 'bg-slate-700/60 border-slate-600 text-slate-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {permCount} permissions
                          </span>
                          {permCount === 0 && (
                            <span className="text-[10px] text-amber-400/80 font-bangla">
                              (কোনো এক্সেস নেই)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(mod)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            mod.isActive !== false ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                          title={mod.isActive !== false ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              mod.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(mod)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition"
                            title="পারমিশন পরিবর্তন করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteModerator(mod)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition border border-red-500/20"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Log Drawer */}
      {showLogs && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white font-bangla">
                সাম্প্রতিক মডারেটর পারমিশন পরিবর্তনের ইতিহাস (Audit Logs)
              </h3>
            </div>
            <button
              onClick={() => setShowLogs(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingLogs ? (
            <p className="text-xs text-slate-400 py-4 text-center">লগ লোড হচ্ছে...</p>
          ) : activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-bangla">
              এখনো কোনো পারমিশন পরিবর্তনের রেকর্ড নেই।
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-amber-300">
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">সম্পাদনকারী: </span>
                    <span className="text-slate-200 font-mono">{log.actorEmail}</span>
                  </div>
                  {log.details?.email && (
                    <div className="text-slate-300">
                      <span className="text-slate-500">লক্ষ্য মডারেটর: </span>
                      <span className="text-slate-200 font-mono">{log.details.email}</span>
                    </div>
                  )}
                  {log.details?.newPermissions && (
                    <div className="pt-1 text-[11px] text-slate-400">
                      <span className="text-slate-500">নতুন পারমিশন ({log.details.newPermissions.length}): </span>
                      <span className="text-emerald-400 font-mono">
                        {log.details.newPermissions.join(', ') || '(None)'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Moderator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-bangla">
                    {isEditing ? 'মডারেটর পারমিশন ও তথ্য সম্পাদনা' : 'নতুন মডারেটর তৈরি করুন'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select granular permissions for this moderator account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    মডারেটরের নাম <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Arif Rahman"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ইমেইল এড্রেস <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      disabled={isEditing}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="moderator@craftykids.com"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isEditing ? 'নতুন পাসওয়ার্ড (পরিবর্তন না চাইলে ফাঁকা রাখুন)' : 'পাসওয়ার্ড *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required={!isEditing}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium">অ্যাকাউন্ট স্ট্যাটাস:</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        formData.isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {formData.isActive ? 'Active (সক্রিয়)' : 'Inactive (নিষ্ক্রিয়)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.isActive ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Ready-made Presets Strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bangla">এক-ক্লিকে রেডিমেড প্রিসেট সেট করুন:</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedPermissions.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/80 hover:border-amber-500/50 rounded-xl text-xs text-slate-200 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{preset.name}</span>
                      <span className="text-[10px] text-slate-400 font-bangla">({preset.nameBn})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions([])}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-xl text-xs transition"
                  >
                    সব ক্লিয়ার করুন
                  </button>
                </div>
              </div>

              {/* Search & Global Select All */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="পারমিশন খুঁজুন (Search permissions)..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl border border-slate-600 transition"
                >
                  {isAllSelected ? 'সবগুলো আন-সিলেক্ট করুন' : 'সবগুলো সিলেক্ট করুন (Select All)'}
                </button>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key);
                  const selectedInGroup = groupKeys.filter((k) => selectedPermissions.includes(k));
                  const isGroupAllChecked =
                    groupKeys.length > 0 && selectedInGroup.length === groupKeys.length;

                  return (
                    <div
                      key={group.id}
                      className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-bangla">
                              {group.nameBn}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({group.name})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{group.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap pl-2"
                        >
                          {isGroupAllChecked ? 'আন-সিলেক্ট' : 'গ্রুপের সব'}
                        </button>
                      </div>

                      {/* Checkbox Items */}
                      <div className="space-y-2">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          const isView = group.viewPermissionKey === perm.key;

                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-amber-500/10 border border-amber-500/20'
                                  : 'hover:bg-slate-800/80 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.key, group)}
                                className="mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-semibold ${
                                      isChecked ? 'text-amber-300' : 'text-slate-200'
                                    }`}
                                  >
                                    {perm.label}
                                  </span>
                                  {isView && (
                                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                                      BASE VIEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-bangla mt-0.5">
                                  {perm.description}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {perm.key}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredGroups.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  &quot;{searchQuery}&quot; এর সাথে মিলে এমন কোনো পারমিশন পাওয়া যায়নি।
                </div>
              )}

              {/* Dependency Rule Callout */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-bangla">
                  <span className="font-semibold text-slate-300">স্বয়ংক্রিয় ডিপেন্ডেন্সি নীতি: </span>
                  কোনো গ্রুপের edit/delete/manage পারমিশন নির্বাচন করলে স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট view
                  পারমিশন টিক হয়ে যাবে। আবার view আনটিক করলে বাকি পারমিশনগুলোও স্বয়ংক্রিয়ভাবে মুছে যাবে।
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-700 flex items-center justify-end gap-3 bg-slate-900/60 sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isEditing ? 'পারমিশন সেভ করুন' : 'মডারেটর তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

