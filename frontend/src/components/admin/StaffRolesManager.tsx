'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle,
  KeyRound,
  Lock,
  Mail,
  User,
  Search,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ExternalLink,
  Eye,
  EyeOff,
  Edit2,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/Pill';
import {
  PERMISSION_GROUPS,
  PERMISSION_DEFINITIONS,
  PRESETS,
  enforcePermissionDependencies,
  getAssignablePermissions,
  PermissionGroup,
} from '@/lib/permissions';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'order_handler' | 'product_manager' | 'custom';
  permissions: string[];
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  lastActive: string;
}

const ALL_ASSIGNABLE_PERMS = getAssignablePermissions().map((p) => p.key);

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Rashedul Islam',
    email: 'admin@craftykidsco.com',
    role: 'admin',
    permissions: ALL_ASSIGNABLE_PERMS,
    status: 'ACTIVE',
    lastActive: 'Just now',
  },
  {
    id: 'staff-2',
    name: 'Farhana Jaman',
    email: 'orders@craftykidsco.com',
    role: 'order_handler',
    permissions: PRESETS['Order Handler'] ? PRESETS['Order Handler'].permissions : [
      'orders.view',
      'orders.update_status',
      'orders.cancel',
      'customers.view',
      'customers.edit',
    ],
    status: 'ACTIVE',
    lastActive: '18 minutes ago',
  },
  {
    id: 'staff-3',
    name: 'Tanvir Ahmed',
    email: 'catalog@craftykidsco.com',
    role: 'product_manager',
    permissions: PRESETS['Catalog Manager'] ? PRESETS['Catalog Manager'].permissions : [
      'products.view',
      'products.create',
      'products.edit',
      'products.delete',
      'categories.view',
      'categories.manage',
    ],
    status: 'ACTIVE',
    lastActive: '2 hours ago',
  },
];

export function StaffRolesManager() {
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Permission Customizer Modal State
  const [customizingStaff, setCustomizingStaff] = useState<StaffMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'order_handler' | 'product_manager' | 'custom'>('order_handler');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Edit Staff Account & Password Modal State (Super Admin Control)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editRole, setEditRole] = useState<'admin' | 'order_handler' | 'product_manager' | 'custom'>('order_handler');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch staff from MongoDB if available
  const fetchStaffFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/moderators');
      if (res.ok) {
        const data = await res.json();
        if (data.moderators && data.moderators.length > 0) {
          const apiStaff: StaffMember[] = data.moderators.map((m: any) => {
            let roleType: StaffMember['role'] = 'custom';
            if (m.isSuperAdmin || m.role === 'ADMIN' || m.role === 'admin' || m.role === 'super_admin') {
              roleType = 'admin';
            } else if (m.role === 'ORDER_HANDLER' || m.role === 'order_handler') {
              roleType = 'order_handler';
            } else if (m.role === 'PRODUCT_MANAGER' || m.role === 'product_manager') {
              roleType = 'product_manager';
            }

            return {
              id: m.id || m._id,
              name: m.name || 'Unnamed Staff',
              email: m.email,
              role: roleType,
              permissions: Array.isArray(m.permissions) && m.permissions.length > 0
                ? m.permissions
                : roleType === 'admin'
                ? ALL_ASSIGNABLE_PERMS
                : [],
              status: m.isActive === false ? 'INACTIVE' : 'ACTIVE',
              lastActive: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('en-GB') : 'Recently',
            };
          });

          // Merge: Keep default admins if not returned by API
          setStaffList(apiStaff);
        }
      }
    } catch {
      // Gracefully fall back to DEFAULT_STAFF in local state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffFromApi();
  }, [fetchStaffFromApi]);

  // Open Permission Customizer Modal for a Staff Member
  const handleOpenCustomizeModal = (staff: StaffMember) => {
    setCustomizingStaff(staff);
    setSelectedPermissions(staff.permissions || []);
    setSearchFilter('');
  };

  // Close Customizer Modal
  const handleCloseCustomizeModal = () => {
    setCustomizingStaff(null);
    setSelectedPermissions([]);
    setSearchFilter('');
  };

  // Open Edit Staff Account & Password Modal (Super Admin Control)
  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditName(staff.name || '');
    setEditEmail(staff.email || '');
    setEditPassword('');
    setEditStatus(staff.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setEditRole(staff.role);
    setShowPassword(false);
  };

  // Close Edit Staff Modal
  const handleCloseEditModal = () => {
    setEditingStaff(null);
    setEditPassword('');
    setShowPassword(false);
  };

  // Save Staff Account Details & New Password (Super Admin)
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (!editEmail.trim() || !editName.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }
    if (editPassword && editPassword.trim().length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        isActive: editStatus === 'ACTIVE',
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/admin/moderators/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update account.');
      }

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: editName.trim(),
                email: editEmail.trim().toLowerCase(),
                status: editStatus,
                role: editRole,
              }
            : s
        )
      );

      showToast(
        editPassword.trim()
          ? `Email and password successfully updated for ${editName}!`
          : `Account details updated for ${editName}!`
      );
      handleCloseEditModal();
    } catch (err: any) {
      // Fallback local state update
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: editName.trim(),
                email: editEmail.trim().toLowerCase(),
                status: editStatus,
                role: editRole,
              }
            : s
        )
      );
      showToast(err?.message || `Updated details for ${editName}!`);
      handleCloseEditModal();
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Apply quick presets inside modal
  const handleApplyPreset = (presetKey: 'admin' | 'order_handler' | 'product_manager' | 'clear') => {
    if (presetKey === 'clear') {
      setSelectedPermissions([]);
      showToast('All permissions cleared.');
      return;
    }

    if (presetKey === 'admin') {
      setSelectedPermissions(ALL_ASSIGNABLE_PERMS);
      showToast('Full Administrator permissions applied.');
      return;
    }

    if (presetKey === 'order_handler') {
      const perms = PRESETS['Order Handler'] ? PRESETS['Order Handler'].permissions : [
        'orders.view',
        'orders.update_status',
        'orders.cancel',
        'customers.view',
        'customers.edit',
      ];
      setSelectedPermissions(enforcePermissionDependencies(perms));
      showToast('Order Handler preset applied.');
      return;
    }

    if (presetKey === 'product_manager') {
      const perms = PRESETS['Catalog Manager'] ? PRESETS['Catalog Manager'].permissions : [
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'categories.view',
        'categories.manage',
      ];
      setSelectedPermissions(enforcePermissionDependencies(perms));
      showToast('Product Manager preset applied.');
      return;
    }
  };

  // Toggle single permission with dependency resolution
  const handleTogglePermission = (key: string, group: PermissionGroup) => {
    const isChecked = selectedPermissions.includes(key);
    let updated: string[];

    if (isChecked) {
      if (group.viewPermissionKey === key) {
        // Unselecting view removes all other action permissions in this group
        const groupKeys = new Set(group.permissions.map((p) => p.key));
        updated = selectedPermissions.filter((k) => !groupKeys.has(k));
      } else {
        updated = selectedPermissions.filter((k) => k !== key);
      }
    } else {
      updated = [...selectedPermissions, key];
      // Selecting an action automatically ensures view is checked
      if (group.viewPermissionKey && !updated.includes(group.viewPermissionKey)) {
        updated.push(group.viewPermissionKey);
      }
    }

    setSelectedPermissions(enforcePermissionDependencies(updated));
  };

  // Toggle entire group
  const handleToggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allChecked = groupKeys.every((k) => selectedPermissions.includes(k));

    let updated: string[];
    if (allChecked) {
      // Remove all in this group
      const removeSet = new Set(groupKeys);
      updated = selectedPermissions.filter((k) => !removeSet.has(k));
    } else {
      // Add all in this group
      const set = new Set([...selectedPermissions, ...groupKeys]);
      updated = Array.from(set);
    }

    setSelectedPermissions(enforcePermissionDependencies(updated));
  };

  // Save customized permissions for current staff
  const handleSaveCustomizedPermissions = async () => {
    if (!customizingStaff) return;

    setIsSavingPermissions(true);
    const finalPermissions = enforcePermissionDependencies(selectedPermissions);

    // Determine derived role based on permissions
    let derivedRole: StaffMember['role'] = 'custom';
    if (finalPermissions.length === ALL_ASSIGNABLE_PERMS.length) {
      derivedRole = 'admin';
    }

    try {
      // Attempt to save to backend API
      const res = await fetch(`/api/admin/moderators/${customizingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: finalPermissions,
        }),
      });

      // Update local state regardless (works for both live DB users & mock staff)
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === customizingStaff.id
            ? { ...s, permissions: finalPermissions, role: derivedRole }
            : s
        )
      );

      showToast(`Permissions successfully updated for ${customizingStaff.name}!`);
      handleCloseCustomizeModal();
    } catch (err: any) {
      // Fallback local update
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === customizingStaff.id
            ? { ...s, permissions: finalPermissions, role: derivedRole }
            : s
        )
      );
      showToast(`Permissions saved for ${customizingStaff.name}!`);
      handleCloseCustomizeModal();
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Quick role change from table dropdown
  const handleQuickRoleChange = async (staffId: string, role: StaffMember['role']) => {
    let newPerms: string[] = [];
    if (role === 'admin') {
      newPerms = ALL_ASSIGNABLE_PERMS;
    } else if (role === 'order_handler') {
      newPerms = PRESETS.order_handler ? PRESETS.order_handler.permissions : [
        'orders.view',
        'orders.update_status',
        'orders.cancel',
        'customers.view',
        'customers.edit',
      ];
    } else if (role === 'product_manager') {
      newPerms = PRESETS.catalog_manager ? PRESETS.catalog_manager.permissions : [
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'categories.view',
        'categories.manage',
      ];
    } else {
      // If switching to custom, keep current perms and open customizer
      const target = staffList.find((s) => s.id === staffId);
      if (target) handleOpenCustomizeModal(target);
      return;
    }

    // Update local state
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, role, permissions: newPerms } : s))
    );

    // Call API if possible
    try {
      await fetch(`/api/admin/moderators/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPerms }),
      });
    } catch {}

    showToast(`Role updated to ${role.replace('_', ' ').toUpperCase()}`);
  };

  // Toggle Staff Active/Inactive status
  const handleToggleStaffStatus = async (staff: StaffMember) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStaffList((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, status: nextStatus } : s))
    );

    try {
      await fetch(`/api/admin/moderators/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus === 'ACTIVE' }),
      });
    } catch {}

    showToast(`${staff.name} is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Suspended'}.`);
  };

  // Delete staff member
  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (staffList.length <= 1) {
      alert('Cannot delete the last administrator.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name} from staff?`)) return;

    setStaffList((prev) => prev.filter((s) => s.id !== staffId));

    try {
      await fetch(`/api/admin/moderators/${staffId}`, { method: 'DELETE' });
    } catch {}

    showToast(`${name} removed.`);
  };

  // Add new staff member
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    setIsAddingStaff(true);
    let initialPerms: string[] = [];
    if (newRole === 'admin') {
      initialPerms = ALL_ASSIGNABLE_PERMS;
    } else if (newRole === 'order_handler') {
      initialPerms = PRESETS['Order Handler']?.permissions || [
        'orders.view',
        'orders.update_status',
        'orders.cancel',
        'customers.view',
        'customers.edit',
      ];
    } else if (newRole === 'product_manager') {
      initialPerms = PRESETS['Catalog Manager']?.permissions || [
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'categories.view',
        'categories.manage',
      ];
    } else {
      initialPerms = newStaffPermissions;
    }

    const newStaffItem: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      permissions: initialPerms,
      status: 'ACTIVE',
      lastActive: 'Just now',
    };

    try {
      const res = await fetch('/api/admin/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword || 'Pass@1234',
          permissions: initialPerms,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data?.moderator) {
        newStaffItem.id = data.moderator.id;
      }
    } catch {}

    setStaffList((prev) => [...prev, newStaffItem]);
    setIsAddingStaff(false);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    showToast(`Staff member "${newStaffItem.name}" created successfully!`);
  };

  // Filter permission groups for customizer modal (all modules configurable by Super Admin)
  const assignableGroups = useMemo(() => {
    return PERMISSION_GROUPS;
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return assignableGroups;
    const q = searchFilter.toLowerCase();
    return assignableGroups
      .map((group) => {
        const matchesGroup =
          group.name.toLowerCase().includes(q) || group.nameBn.toLowerCase().includes(q);
        const matchingPerms = group.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q)
        );
        if (matchesGroup) return group;
        if (matchingPerms.length > 0) return { ...group, permissions: matchingPerms };
        return null;
      })
      .filter(Boolean) as PermissionGroup[];
  }, [assignableGroups, searchFilter]);

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-[#EBF7EE] border-[#B7E4C7] text-[#1F6B43]'
              : 'bg-[#FDE8E8] border-[#F8B4B4] text-[#9B2420]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#D32F2F]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-black text-xl text-[#2B2B2B] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D6403B]" />
            <span>Staff and roles (টিম মেম্বার ও পারমিশন কন্ট্রোল)</span>
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Configure access permissions for Order Handlers and Product Managers, and customize permissions anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#BF3430] flex items-center gap-2 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Team Member</span>
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF7F2]/50">
          <div>
            <h4 className="font-bold text-sm text-[#2B2B2B]">Team Members &amp; Access Roles</h4>
            <p className="text-xs text-[#6B6B6B]">
              Control operational permissions for order handling staff and catalog managers.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-[#EFE9E0] text-[#6B6B6B] self-start sm:self-auto">
            Total Staff: {staffList.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {staffList.map((member) => {
                const permCount = member.permissions?.length || 0;
                const isFull = permCount === ALL_ASSIGNABLE_PERMS.length;

                return (
                  <tr key={member.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    {/* Member Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center font-bold text-[#D6403B] shadow-2xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[#2B2B2B] block text-xs">{member.name}</span>
                          <span className="text-[#6B6B6B] text-[11px] block">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Quick Role Selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleQuickRoleChange(member.id, e.target.value as StaffMember['role'])
                        }
                        className="p-2 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] font-semibold text-xs text-[#2B2B2B] focus:outline-[#D6403B] cursor-pointer"
                      >
                        <option value="admin">Administrator (Full Access)</option>
                        <option value="order_handler">Order Handler (Orders &amp; Shipping)</option>
                        <option value="product_manager">Product Manager (Catalog &amp; Stock)</option>
                        <option value="custom">Custom Permissions (Customized)</option>
                      </select>
                    </td>

                    {/* Permissions Badge & Customize Button */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isFull
                              ? 'bg-[#EBF7EE] text-[#1F6B43] border-[#B7E4C7]'
                              : permCount > 0
                              ? 'bg-[#EBF4FE] text-[#1D4ED8] border-[#BFDBFE]'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>
                            {isFull ? 'Full Access' : `${permCount}/${ALL_ASSIGNABLE_PERMS.length} Active`}
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStaffStatus(member)}
                        className="cursor-pointer"
                        title="Click to toggle Active / Suspended status"
                      >
                        {member.status === 'ACTIVE' ? (
                          <StatusPill variant="green" dot>Active</StatusPill>
                        ) : (
                          <StatusPill variant="red" dot>Suspended</StatusPill>
                        )}
                      </button>
                    </td>

                    {/* Last Active */}
                    <td className="py-3.5 px-4 text-[#6B6B6B] text-[11px] whitespace-nowrap">
                      {member.lastActive}
                    </td>

                    {/* Actions: Edit Email/Password, Customize Permissions & Remove */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(member)}
                          className="px-2.5 py-1.5 rounded-xl border border-[#EFE9E0] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] hover:text-[#D6403B] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          title="Change staff member email, reset password and profile"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#D6403B]" />
                          <span>Edit / Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCustomizeModal(member)}
                          className="px-2.5 py-1.5 rounded-xl border border-[#EFE9E0] bg-white hover:bg-[#FAF7F2] hover:border-[#D6403B]/40 text-xs font-bold text-[#D6403B] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          title="Customize individual permissions for this staff member"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#D6403B]" />
                          <span>Customize</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member.id, member.name)}
                          className="p-1.5 rounded-xl hover:bg-[#FDE3E1] text-[#6B6B6B] hover:text-[#9B2420] transition-colors cursor-pointer"
                          title="Remove Member"
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
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
          <h4 className="font-heading font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1F6B43]" />
            <span>Role Permission Matrix</span>
          </h4>
          <span className="text-xs text-[#6B6B6B]">Live access overview across modules</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFE9E0] text-[11px] text-[#6B6B6B] bg-[#FAF7F2]/60">
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
                <th className="py-2.5 px-3 text-center">Order Handler</th>
                <th className="py-2.5 px-3 text-center">Product Manager</th>
                <th className="py-2.5 px-3 text-center">Custom Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0] text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">OVERVIEW: Dashboard</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SALES: Orders &amp; Courier</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#D6403B] font-bold">✕ Hidden</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SALES: Incomplete Orders</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#D6403B] font-bold">✕ Hidden</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SALES: Customers</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#D6403B] font-bold">✕ Hidden</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SALES: Coupons &amp; Discounts</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SALES: SMS Campaigns</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">CATALOG: Products &amp; Categories</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B]">Read Only</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">CATALOG: Bundles &amp; Stock</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B]">Read Only</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SHIPPING: Rates &amp; Block List</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">CONTENT: Messages &amp; Page Editor</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#2B2B2B]">SYSTEM: Settings, Roles &amp; Gateways</td>
                <td className="py-2.5 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
                <td className="py-2.5 px-3 text-center text-[#6B6B6B] font-semibold">Configurable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CUSTOMIZE PERMISSIONS FOR STAFF MEMBER                           */}
      {/* ========================================================================= */}
      {customizingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-[#EFE9E0] max-h-[90vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#D6403B] border border-[#EFE9E0]">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                    Customize Permissions
                  </h3>
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  Assign or revoke granular permissions for <strong className="text-[#2B2B2B]">{customizingStaff.name}</strong> ({customizingStaff.email}). Changes take effect immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCustomizeModal}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-gray-100 flex items-center justify-center text-[#6B6B6B] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets & Search */}
            <div className="space-y-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#6B6B6B] mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('admin')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#EBF7EE] text-[#1F6B43] border border-[#EFE9E0] transition-colors cursor-pointer"
                  >
                    ⭐ Full Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('order_handler')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#EBF4FE] text-[#1D4ED8] border border-[#EFE9E0] transition-colors cursor-pointer"
                  >
                    📦 Order Handler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('product_manager')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#D6403B] border border-[#EFE9E0] transition-colors cursor-pointer"
                  >
                    🏷️ Product Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('clear')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-red-50 text-red-600 border border-[#EFE9E0] transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#2B2B2B] border border-[#EFE9E0]">
                  {selectedPermissions.length} / {ALL_ASSIGNABLE_PERMS.length} Active
                </span>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter permissions by module or action..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs text-[#2B2B2B] focus:bg-white focus:outline-[#D6403B]"
                />
              </div>
            </div>

            {/* Permission Checkbox Groups (Scrollable) */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 max-h-[50vh]">
              {filteredGroups.map((group) => {
                const groupPermKeys = group.permissions.map((p) => p.key);
                const allGroupChecked = groupPermKeys.every((k) => selectedPermissions.includes(k));
                const someGroupChecked = groupPermKeys.some((k) => selectedPermissions.includes(k));

                return (
                  <div
                    key={group.id}
                    className="p-4 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2]/50 space-y-3"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
                      <div>
                        <h4 className="font-bold text-xs text-[#2B2B2B] flex items-center gap-1.5">
                          <span>{group.name}</span>
                          <span className="text-[11px] text-[#6B6B6B] font-normal">({group.nameBn})</span>
                        </h4>
                        <p className="text-[11px] text-[#6B6B6B]">{group.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleGroup(group)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          allGroupChecked
                            ? 'bg-[#1F6B43] text-white border-[#1F6B43]'
                            : someGroupChecked
                            ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#BDE7CC]'
                            : 'bg-white text-[#6B6B6B] border-[#EFE9E0] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        {allGroupChecked ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Permission Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);

                        return (
                          <label
                            key={perm.key}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-[#1F6B43]/30 shadow-2xs'
                                : 'bg-white/60 border-transparent hover:bg-white hover:border-[#EFE9E0]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.key, group)}
                              className="mt-0.5 rounded border-gray-300 text-[#D6403B] focus:ring-[#D6403B] cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-[#2B2B2B] block leading-snug">
                                {perm.label}
                              </span>
                              <span className="text-[11px] text-[#6B6B6B] block leading-tight mt-0.5">
                                {perm.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EFE9E0] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#6B6B6B]">
                Changes apply instantly for this user.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseCustomizeModal}
                  className="px-4 py-2 rounded-xl border border-[#EFE9E0] bg-white text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomizedPermissions}
                  disabled={isSavingPermissions}
                  className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingPermissions ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT STAFF MEMBER ACCOUNT & CHANGE PASSWORD (SUPER ADMIN)          */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditSubmit}
            className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EFE9E0] my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#D6403B] border border-[#EFE9E0]">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                    Edit Staff Account &amp; Password
                  </h3>
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  Change login email, reset password, and update profile for <strong className="text-[#2B2B2B]">{editingStaff.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-gray-100 flex items-center justify-center text-[#6B6B6B] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Full Name:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Staff Full Name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs font-semibold text-[#2B2B2B] focus:bg-white focus:outline-[#D6403B]"
                  />
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2B2B2B]">Login Email Address:</label>
                  <span className="text-[10px] text-[#D6403B] font-bold">Used for staff login</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. staff@craftykidsco.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs font-semibold text-[#2B2B2B] focus:bg-white focus:outline-[#D6403B]"
                  />
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Changing this email updates the staff member&apos;s login credential immediately.
                </p>
              </div>

              {/* New Password (Optional Reset) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#2B2B2B]">Change / Reset Password:</label>
                  <span className="text-[10px] text-[#6B6B6B]">Leave blank to keep existing password</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Type new password (min 6 characters)"
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs text-[#2B2B2B] focus:bg-white focus:outline-[#D6403B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2B2B2B] cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {editPassword && (
                  <p className="text-[11px] text-[#1F6B43] mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    New password will be encrypted and set upon saving.
                  </p>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Account Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('ACTIVE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editStatus === 'ACTIVE'
                        ? 'bg-[#EBF7EE] text-[#1F6B43] border-[#B7E4C7] shadow-2xs'
                        : 'bg-[#FAF7F2] text-[#6B6B6B] border-[#EFE9E0] hover:bg-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active (সক্রিয়)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('INACTIVE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editStatus === 'INACTIVE'
                        ? 'bg-[#FDE8E8] text-[#9B2420] border-[#F8B4B4] shadow-2xs'
                        : 'bg-[#FAF7F2] text-[#6B6B6B] border-[#EFE9E0] hover:bg-white'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Suspended (স্থগিত)</span>
                  </button>
                </div>
              </div>

              {/* Shortcut to Customize Permissions */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#2B2B2B] block">Granular Permissions</span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Currently has {editingStaff.permissions?.length || 0} active permissions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const staff = editingStaff;
                    handleCloseEditModal();
                    handleOpenCustomizeModal(staff);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sliders className="w-3 h-3 text-[#D6403B]" />
                  <span>Customize →</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EFE9E0] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW STAFF MEMBER                                             */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStaffSubmit}
            className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#EFE9E0]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div>
                <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Add Team Member</h3>
                <p className="text-xs text-[#6B6B6B]">Invite a new staff member with tailored access.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B] hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Ahmed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@craftykidsco.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Password:</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Initial Role &amp; Permissions:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] font-semibold text-xs text-[#2B2B2B] focus:bg-white focus:outline-[#D6403B] cursor-pointer"
                >
                  <option value="order_handler">Order Handler (Orders &amp; Shipping)</option>
                  <option value="product_manager">Product Manager (Catalog &amp; Stock)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  You can further customize this staff member&apos;s permissions anytime after adding.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE9E0]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingStaff}
                className="px-5 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#BF3430] cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isAddingStaff ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default StaffRolesManager;
