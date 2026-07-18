'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { adminApi } from '@/lib/admin';
import { UserOut } from '@/lib/auth';

type AuditLog = {
  id: string;
  user: string;
  email: string;
  action: string;
  category: 'Login' | 'User Action' | 'Role Change';
  ipAddress: string;
  timestamp: Date;
};

export default function AdminAuditLogsPage() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Login' | 'User Action' | 'Role Change'>('All');
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await adminApi.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users for audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const logs = useMemo(() => {
    const generatedLogs: AuditLog[] = [];
    users.forEach(user => {
      // 1. Account Created Log
      if (user.created_at) {
        generatedLogs.push({
          id: `${user.id}-created`,
          user: user.full_name,
          email: user.email,
          action: `Account created (${user.role})`,
          category: 'User Action',
          ipAddress: 'System',
          timestamp: new Date(user.created_at)
        });
      }
      
      // 2. Last Login Log
      if (user.last_login_at) {
        generatedLogs.push({
          id: `${user.id}-login`,
          user: user.full_name,
          email: user.email,
          action: 'Logged in successfully',
          category: 'Login',
          ipAddress: 'Unknown',
          timestamp: new Date(user.last_login_at)
        });
      }
    });

    // Sort descending by timestamp
    return generatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [users]);

  const filteredLogs = filter === 'All' ? logs : logs.filter(log => log.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Audit Logs</h2>
          <p className="mt-1 text-sm text-zinc-500">Monitor system activity, logins, and role changes.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="All">All Categories</option>
            <option value="Login">Login Activity</option>
            <option value="User Action">User Actions</option>
            <option value="Role Change">Role Changes</option>
          </select>
          <button className="inline-flex items-center gap-2 justify-center rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Timestamp</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Action Details</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-zinc-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-zinc-500">
                  No logs found for the selected category.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {format(log.timestamp, 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{log.user}</span>
                      <span className="text-xs text-zinc-500">{log.email}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      log.category === 'Login' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                      log.category === 'Role Change' ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                      'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                    }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900">
                    {log.action}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 font-mono">
                    {log.ipAddress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
