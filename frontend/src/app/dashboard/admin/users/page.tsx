'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { UserOut } from '@/lib/auth';

function UsersTableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialFilter = searchParams.get('role') || searchParams.get('filter') || 'All';

  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState(initialFilter);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserOut | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'candidate',
    password: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filteredUsers = users.filter(u => {
    if (filter === 'All') return true;
    if (filter === 'Active') return u.is_active;
    if (filter === 'Inactive') return !u.is_active;
    if (filter.toLowerCase() === u.role) return true;
    return false;
  });

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    router.replace(`/dashboard/admin/users?filter=${newFilter}`);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', role: 'candidate', password: '', is_active: true });
    setFormError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserOut) => {
    setEditingUser(user);
    setFormData({ 
      full_name: user.full_name, 
      email: user.email, 
      role: user.role, 
      password: '', // blank by default
      is_active: user.is_active 
    });
    setFormError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        await adminApi.createUser({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          password: formData.password
        });
      }
      setShowModal(false);
      setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <svg className="animate-spin h-6 w-6 text-indigo-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading users…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">User Management</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage platform users, roles, and access.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="All">All Users</option>
            <option value="Active">Active Users</option>
            <option value="Inactive">Inactive Users</option>
            <option value="admin">Admin</option>
            <option value="candidate">Candidate</option>
            <option value="client_manager">Client Manager</option>
            <option value="finance_team">Finance</option>
          </select>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
          <p className="text-sm font-medium text-emerald-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">User Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-zinc-500">No users found for this filter.</td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">{u.full_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {u.is_active ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Inactive</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="text-zinc-600 hover:text-zinc-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="relative z-50">
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity" />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">
                    {editingUser ? 'Edit User' : 'Add User'}
                  </h3>
                  
                  {formError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                      {formError}
                    </div>
                  )}

                  <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-zinc-900">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-zinc-900">Email</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingUser}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-zinc-900">Role</label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <option value="admin">Admin</option>
                        <option value="candidate">Candidate</option>
                        <option value="client_manager">Client Manager</option>
                        <option value="finance_team">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-zinc-900">
                        {editingUser ? 'Reset Password (optional)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                    {editingUser && (
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-zinc-900">
                          Active User
                        </label>
                      </div>
                    )}
                  </form>
                </div>
                <div className="bg-zinc-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    form="user-form"
                    disabled={saving}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading component...</div>}>
      <UsersTableContent />
    </Suspense>
  );
}
