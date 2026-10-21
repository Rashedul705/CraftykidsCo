'use client';

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle,
  KeyRound,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { AdminRole } from '@/components/admin/AdminShell';
import { StatusPill } from '@/components/ui/Pill';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'INVITED';
  lastActive: string;
}

export function StaffRolesManager() {
  const [staffList, setStaffList] = useState<StaffUser[]>([
    {
      id: 'staff-1',
      name: 'Rashedul Islam',
      email: 'admin@craftykidsco.com',
      role: 'admin',
      status: 'ACTIVE',
      lastActive: 'Just now',
    },
    {
      id: 'staff-2',
      name: 'Farhana Jaman',
      email: 'orders@craftykidsco.com',
      role: 'order_handler',
      status: 'ACTIVE',
      lastActive: '18 minutes ago',
    },
    {
      id: 'staff-3',
      name: 'Tanvir Ahmed',
      email: 'catalog@craftykidsco.com',
      role: 'product_manager',
      status: 'ACTIVE',
      lastActive: '2 hours ago',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('order_handler');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRoleChange = (id: string, role: AdminRole) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    setFeedback(`Role updated to ${role}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      status: 'INVITED',
      lastActive: 'Never',
    };

    setStaffList((prev) => [...prev, newStaff]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setFeedback(`Invitation sent to ${newEmail}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (staffList.length <= 1) {
      alert('Cannot delete the last administrator.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name} from staff?`)) return;
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setFeedback(`${name} removed.`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Team Members &amp; Access Roles</h3>
          <p className="text-xs text-[#6B6B6B]">
            Control operational permissions for order handling staff and catalog managers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Add Team Member
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center font-bold text-[#D6403B]">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-[#2B2B2B] block text-xs">{member.name}</span>
                        <span className="text-[#6B6B6B] text-[11px] block">{member.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as AdminRole)}
                      className="p-1.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] font-semibold text-xs text-[#2B2B2B] focus:outline-[#D6403B] cursor-pointer"
                    >
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="order_handler">Order Handler (Orders &amp; Shipping)</option>
                      <option value="product_manager">Product Manager (Catalog &amp; Stock)</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    {member.status === 'ACTIVE' ? (
                      <StatusPill variant="green" dot>Active</StatusPill>
                    ) : (
                      <StatusPill variant="yellow" dot>Invited</StatusPill>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-[#6B6B6B] text-[11px]">
                    {member.lastActive}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="p-1.5 rounded-lg hover:bg-[#FDE3E1] text-[#6B6B6B] hover:text-[#9B2420] transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h4 className="font-heading font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1F6B43]" /> Role Permission Matrix
        </h4>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFE9E0] text-[11px] text-[#6B6B6B]">
                <th className="py-2 px-3">Module</th>
                <th className="py-2 px-3 text-center">Administrator</th>
                <th className="py-2 px-3 text-center">Order Handler</th>
                <th className="py-2 px-3 text-center">Product Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0] text-[11px]">
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Orders &amp; Steadfast Courier</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Incomplete Orders &amp; Customers</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Catalog, Variations &amp; Bundles</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#6B6B6B]">Read Only</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Stock &amp; Inventory Adjuster</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#6B6B6B]">Read Only</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Financial Reports &amp; Margins</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-[#2B2B2B]">Gateway Keys &amp; Staff Roles</td>
                <td className="py-2 px-3 text-center text-[#1F6B43] font-bold">✓ Full</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
                <td className="py-2 px-3 text-center text-[#D6403B]">✕ Hidden</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStaff}
            className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#EFE9E0]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Add Team Member</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B]"
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
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
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
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Role &amp; Permissions:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                >
                  <option value="order_handler">Order Handler (Orders &amp; Shipping)</option>
                  <option value="product_manager">Product Manager (Catalog &amp; Stock)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E]"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default StaffRolesManager;
