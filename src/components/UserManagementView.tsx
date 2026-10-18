import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog } from '../types';
import { api } from '../services/api';
import { 
  Users, UserPlus, Shield, Activity, 
  Check, Lock, Mail, Phone, Eye 
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subTab, setSubTab] = useState<'users' | 'audit'>('users');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+971 ');
  const [newRole, setNewRole] = useState<UserRole>('BOOKING_AGENT');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [uList, lList] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      setUsers(uList);
      setAuditLogs(lList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createUser({
        username: newUsername.trim(),
        full_name: newFullName.trim() || newUsername.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole
      });
      setShowAddUserModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Team Roles & Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-Based Access Control (RBAC) & cryptographic audit records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subTab === 'users' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Team Members ({users.length})
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subTab === 'audit' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Security Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition ml-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Role Definitions Guidance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-300 space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Full root authority: user management, roles, database backups, audit history, and configuration.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-slate-300 space-y-1">
          <div className="font-bold text-teal-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Dispatcher</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Fleet operations: assign chauffeurs and vehicles, conflict overrides, trip status tracking, and dispatch reports.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 text-slate-300 space-y-1">
          <div className="font-bold text-sky-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Booking Agent</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Customer intake: create reservations, search trips, and generate passenger vouchers. No admin access.
          </p>
        </div>
      </div>

      {/* SUBTAB: USERS */}
      {subTab === 'users' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Corporate Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono text-teal-300">{u.username}</td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        u.role === 'ADMINISTRATOR'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : u.role === 'DISPATCHER'
                          ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-emerald-400">● {u.status}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{u.last_login_at || 'Never'}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">{u.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: AUDIT LOGS */}
      {subTab === 'audit' && (
        <div className="bg-[#0d2137]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">System Audit & Security Trail</h3>
            <span className="text-xs text-slate-400 font-mono">Immutable Log Entries</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 tabular-nums">{log.created_at}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{log.full_name || log.username}</td>
                    <td className="py-2.5 px-3 text-teal-400">{log.role}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{log.details_json || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Team Member</h3>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Layla Mahmoud"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. lmahmoud"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="layla@gulftaxis.com"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">System Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="BOOKING_AGENT">Booking Agent (Bookings & Vouchers)</option>
                  <option value="DISPATCHER">Dispatcher (Trip Allocation & Fleet)</option>
                  <option value="ADMINISTRATOR">Administrator (Full Access & Backups)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Temporary Initial Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                >
                  {loading ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
