'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserOut } from '@/lib/auth';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

type Tab = 'personal' | 'security' | 'activity';

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700 ring-red-600/20';
    case 'client_manager': return 'bg-amber-100 text-amber-700 ring-amber-600/20';
    case 'finance_team': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
    case 'candidate': return 'bg-indigo-100 text-indigo-700 ring-indigo-600/20';
    case 'recruiter': return 'bg-violet-100 text-violet-700 ring-violet-600/20';
    default: return 'bg-zinc-100 text-zinc-700 ring-zinc-600/20';
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'client_manager': return 'Client Manager';
    case 'finance_team': return 'Finance Team';
    case 'candidate': return 'Candidate';
    case 'recruiter': return 'Recruiter';
    default: return role;
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarGradient(role: string) {
  switch (role) {
    case 'admin': return 'from-red-500 to-rose-600';
    case 'client_manager': return 'from-amber-500 to-orange-600';
    case 'finance_team': return 'from-emerald-500 to-teal-600';
    case 'candidate': return 'from-indigo-500 to-violet-600';
    case 'recruiter': return 'from-violet-500 to-purple-600';
    default: return 'from-zinc-500 to-zinc-600';
  }
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl p-4 shadow-lg ring-1 max-w-sm animate-in slide-in-from-bottom-2 fade-in ${
      type === 'success' ? 'bg-emerald-50 ring-emerald-200' : 'bg-red-50 ring-red-200'
    }`}>
      <span className="text-lg shrink-0">{type === 'success' ? '✅' : '❌'}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{message}</p>
      </div>
      <button onClick={onClose} className={`shrink-0 text-xs ${type === 'success' ? 'text-emerald-500 hover:text-emerald-700' : 'text-red-500 hover:text-red-700'}`}>✕</button>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-200 rounded ${className}`} />;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get<UserOut>('/auth/me').then(data => {
      setUser(data);
      setNameInput(data.full_name);
    }).catch(() => {
      setToast({ message: 'Failed to load profile data.', type: 'error' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === user?.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.patch<UserOut, { full_name: string }>('/auth/me', { full_name: nameInput.trim() });
      setUser(updated);
      setEditingName(false);
      setToast({ message: 'Name updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update name.', type: 'error' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { current_password: pwCurrent, new_password: pwNew });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setToast({ message: 'Password changed successfully!', type: 'success' });
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'activity', label: 'Activity', icon: '📋' },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-8">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 to-blue-500" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${getAvatarGradient(user.role)} flex items-center justify-center shadow-md ring-4 ring-white`}>
            <span className="text-2xl font-black text-white tracking-tight">{getInitials(user.full_name)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{user.full_name}</h1>
              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getRoleBadgeStyle(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
              {user.is_active ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-600/20">
                  Inactive
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Member since {format(parseISO(user.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          <button
            onClick={() => { setEditingName(true); setActiveTab('personal'); }}
            className="flex-shrink-0 rounded-xl bg-white border border-zinc-200 shadow-sm px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel — Info Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden">
            <div className="p-5 border-b border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Account Information</h3>
            </div>
            <div className="p-5 space-y-4">
              <InfoRow icon="✉️" label="Email" value={user.email} />
              <InfoRow icon="🏷️" label="Role" value={getRoleLabel(user.role)} />
              <InfoRow icon="🔖" label="User ID" value={user.id.slice(0, 8) + '...'} mono />
              <InfoRow icon="📅" label="Joined" value={format(parseISO(user.created_at), 'MMM d, yyyy')} />
              <InfoRow
                icon="🕐"
                label="Last Login"
                value={user.last_login_at ? formatDistanceToNow(parseISO(user.last_login_at), { addSuffix: true }) : 'Never'}
              />
              <InfoRow
                icon="✅"
                label="Status"
                value={user.is_active ? 'Active' : 'Inactive'}
                valueClass={user.is_active ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}
              />
              <InfoRow
                icon="📧"
                label="Verified"
                value={user.is_verified ? 'Verified' : 'Not Verified'}
                valueClass={user.is_verified ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-5">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction icon="✏️" label="Edit Name" onClick={() => { setActiveTab('personal'); setEditingName(true); }} />
              <QuickAction icon="🔒" label="Change Password" onClick={() => setActiveTab('security')} />
            </div>
          </div>
        </div>

        {/* Right Panel — Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Nav */}
          <div className="bg-zinc-100/80 rounded-2xl p-1.5 flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/50'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden">
            {activeTab === 'personal' && (
              <PersonalTab
                user={user}
                editingName={editingName}
                nameInput={nameInput}
                onNameChange={setNameInput}
                onEditName={() => setEditingName(true)}
                onSaveName={handleSaveName}
                onCancelEdit={() => { setEditingName(false); setNameInput(user.full_name); }}
                savingName={savingName}
              />
            )}
            {activeTab === 'security' && (
              <SecurityTab
                user={user}
                pwCurrent={pwCurrent}
                pwNew={pwNew}
                pwConfirm={pwConfirm}
                pwError={pwError}
                savingPw={savingPw}
                onCurrentChange={setPwCurrent}
                onNewChange={setPwNew}
                onConfirmChange={setPwConfirm}
                onSubmit={handleChangePassword}
              />
            )}
            {activeTab === 'activity' && (
              <ActivityTab user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono, valueClass }: {
  icon: string; label: string; value: string; mono?: boolean; valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm mt-0.5 truncate ${mono ? 'font-mono text-zinc-600' : 'text-zinc-900'} ${valueClass || ''}`}>{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-indigo-600 transition-colors group"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
      <svg className="ml-auto h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

function PersonalTab({ user, editingName, nameInput, onNameChange, onEditName, onSaveName, onCancelEdit, savingName }: {
  user: UserOut;
  editingName: boolean;
  nameInput: string;
  onNameChange: (v: string) => void;
  onEditName: () => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  savingName: boolean;
}) {
  return (
    <div>
      <div className="px-6 py-5 border-b border-zinc-100">
        <h3 className="text-base font-bold text-zinc-900">Personal Information</h3>
        <p className="text-sm text-zinc-500 mt-0.5">Update your personal details here.</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Full Name */}
        <FormField label="Full Name" required>
          {editingName ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={e => onNameChange(e.target.value)}
                autoFocus
                className="flex-1 rounded-xl border-0 py-2.5 px-4 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <button
                onClick={onSaveName}
                disabled={savingName}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={onCancelEdit}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-2.5">
              <span className="text-sm text-zinc-900 font-medium">{user.full_name}</span>
              <button
                onClick={onEditName}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </FormField>

        {/* Email */}
        <FormField label="Email Address" hint="Email cannot be changed. Contact an administrator if needed.">
          <div className="flex items-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200 px-4 py-2.5">
            <span className="text-sm text-zinc-500 font-medium">{user.email}</span>
            <span className="ml-auto text-xs text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-lg">Read-only</span>
          </div>
        </FormField>

        {/* Role */}
        <FormField label="Role">
          <div className="flex items-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200 px-4 py-2.5">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getRoleBadgeStyle(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
            <span className="ml-auto text-xs text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-lg">Read-only</span>
          </div>
        </FormField>

        {/* Account Created */}
        <FormField label="Member Since">
          <div className="rounded-xl bg-zinc-50 ring-1 ring-zinc-200 px-4 py-2.5">
            <span className="text-sm text-zinc-900">{format(parseISO(user.created_at), 'MMMM d, yyyy')}</span>
          </div>
        </FormField>
      </div>
    </div>
  );
}

function SecurityTab({ user, pwCurrent, pwNew, pwConfirm, pwError, savingPw, onCurrentChange, onNewChange, onConfirmChange, onSubmit }: {
  user: UserOut;
  pwCurrent: string; pwNew: string; pwConfirm: string; pwError: string; savingPw: boolean;
  onCurrentChange: (v: string) => void;
  onNewChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div>
      <div className="px-6 py-5 border-b border-zinc-100">
        <h3 className="text-base font-bold text-zinc-900">Security Settings</h3>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your password and account security.</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Last Login Info */}
        <div className="rounded-xl bg-zinc-50 ring-1 ring-zinc-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">🔑</span>
            <h4 className="text-sm font-bold text-zinc-900">Login Activity</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Last Login</p>
              <p className="text-sm font-medium text-zinc-900 mt-1">
                {user.last_login_at ? formatDistanceToNow(parseISO(user.last_login_at), { addSuffix: true }) : 'Never'}
              </p>
              {user.last_login_at && (
                <p className="text-xs text-zinc-400 mt-0.5">{format(parseISO(user.last_login_at), 'MMM d, yyyy h:mm a')}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Account Status</p>
              <div className="mt-1">
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">🔒</span>
            <h4 className="text-sm font-bold text-zinc-900">Change Password</h4>
          </div>

          {pwError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-2">
              <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{pwError}</p>
            </div>
          )}

          <PasswordField id="pw-current" label="Current Password" value={pwCurrent} onChange={onCurrentChange} placeholder="Enter current password" required />
          <PasswordField id="pw-new" label="New Password" value={pwNew} onChange={onNewChange} placeholder="At least 8 characters" required />
          <PasswordField id="pw-confirm" label="Confirm New Password" value={pwConfirm} onChange={onConfirmChange} placeholder="Repeat new password" required />

          <button
            type="submit"
            disabled={savingPw || !pwCurrent || !pwNew || !pwConfirm}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingPw ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, placeholder, required }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="block w-full rounded-xl border-0 py-2.5 px-4 pr-12 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function ActivityTab({ user }: { user: UserOut }) {
  const events = [
    user.last_login_at && {
      icon: '🔑',
      color: 'bg-indigo-100',
      title: 'Logged in',
      time: user.last_login_at,
      desc: 'Authenticated to the Lorvish platform.',
    },
    {
      icon: '🎉',
      color: 'bg-emerald-100',
      title: 'Account created',
      time: user.created_at,
      desc: `Joined Lorvish as ${getRoleLabel(user.role)}.`,
    },
  ].filter(Boolean) as { icon: string; color: string; title: string; time: string; desc: string }[];

  return (
    <div>
      <div className="px-6 py-5 border-b border-zinc-100">
        <h3 className="text-base font-bold text-zinc-900">Recent Activity</h3>
        <p className="text-sm text-zinc-500 mt-0.5">Your recent account activity.</p>
      </div>
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-4">📋</span>
            <h4 className="text-sm font-bold text-zinc-900 mb-1">No activity yet</h4>
            <p className="text-sm text-zinc-500">Your account events will appear here.</p>
          </div>
        ) : (
          <ol className="relative border-l border-zinc-200 pl-6 space-y-6">
            {events.map((event, i) => (
              <li key={i} className="relative">
                <div className={`absolute -left-[30px] flex h-8 w-8 items-center justify-center rounded-full ${event.color} ring-4 ring-white`}>
                  <span className="text-sm">{event.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-zinc-900">{event.title}</span>
                    <span className="text-xs text-zinc-400">{formatDistanceToNow(parseISO(event.time), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-0.5">{event.desc}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{format(parseISO(event.time), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
