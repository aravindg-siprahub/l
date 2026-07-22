'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import { adminApi } from '@/lib/admin';
import { UserOut } from '@/lib/auth';
import { Users, User, Briefcase, Landmark, UserPlus, LogIn } from 'lucide-react';

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
      { title: 'Total Users', value: users.length.toString(), icon: <Users size={20} />, color: 'indigo' as const },
      { title: 'Candidates', value: users.filter(u => u.role === 'candidate').length.toString(), icon: <User size={20} />, color: 'emerald' as const },
      { title: 'Client Managers', value: users.filter(u => u.role === 'client_manager').length.toString(), icon: <Briefcase size={20} />, color: 'amber' as const },
      { title: 'Finance Users', value: users.filter(u => u.role === 'finance_team').length.toString(), icon: <Landmark size={20} />, color: 'cyan' as const },
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
            icon: <UserPlus size={16} />, 
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
            icon: <LogIn size={16} />, 
            color: 'indigo',
            href: '#'
          }
        });
      }
    });

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20) // Show top 20 recent activities
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => <StatsCard key={s.title} {...s} />)}
          </div>

          {/* Main activity area */}
          <div className="w-full">
            <ActivityFeed items={activityFeed} scrollable={true} />
          </div>
        </>
      )}
    </div>
  );
}
