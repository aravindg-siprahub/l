'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import { adminApi } from '@/lib/admin';
import { UserOut } from '@/lib/auth';

const actions: QuickAction[] = [
  { label: 'Add User', icon: '➕', href: '/dashboard/admin/users', color: 'indigo', description: 'Create account' },
  { label: 'Manage Users', icon: '👥', href: '/dashboard/admin/users', color: 'cyan', description: 'Manage access' },
  { label: 'Audit Logs', icon: '📋', href: '/dashboard/admin/audit', color: 'zinc', description: 'Activity trail' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await adminApi.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.is_active);
    return [
      { title: 'Total Users', value: users.length.toString(), icon: '👥', color: 'indigo' as const },
      { title: 'Candidates', value: users.filter(u => u.role === 'candidate').length.toString(), icon: '🧑‍💼', color: 'emerald' as const },
      { title: 'Client Managers', value: users.filter(u => u.role === 'client_manager').length.toString(), icon: '👔', color: 'amber' as const },
      { title: 'Finance Users', value: users.filter(u => u.role === 'finance_team').length.toString(), icon: '🏦', color: 'cyan' as const },
    ];
  }, [users]);

  const activityFeed = useMemo(() => {
    const events: { id: string; timestamp: Date; item: ActivityItem }[] = [];
    users.forEach(user => {
      if (user.created_at) {
        events.push({
          id: `${user.id}-created`,
          timestamp: new Date(user.created_at),
          item: { 
            id: `${user.id}-created`, 
            title: user.full_name, 
            subtitle: `Account created`, 
            description: `Role: ${user.role}`, 
            timeAgo: '', 
            badgeLabel: 'New User',
            icon: '➕', 
            color: 'emerald',
            href: '#'
          }
        });
      }
      if (user.last_login_at) {
        events.push({
          id: `${user.id}-login`,
          timestamp: new Date(user.last_login_at),
          item: { 
            id: `${user.id}-login`, 
            title: user.full_name, 
            subtitle: 'Logged in', 
            description: '', 
            timeAgo: '', 
            badgeLabel: 'Login',
            icon: '🔑', 
            color: 'indigo',
            href: '#'
          }
        });
      }
    });

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) // Show top 10 recent activities
      .map(event => ({
        ...event.item,
        timeAgo: formatDistanceToNow(event.timestamp, { addSuffix: true })
      }));
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Platform overview and system management</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-500">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map(s => <StatsCard key={s.title} {...s} />)}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed items={activityFeed} />
            </div>
            <div>
              <QuickActions actions={actions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
