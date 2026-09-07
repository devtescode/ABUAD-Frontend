import { Eye, Ban } from 'lucide-react';
import {
  DashboardLayout,
  DashboardHeader,
} from '@/components/DashboardLayout';

import { adminNavItems } from '@/data/adminNavItems';

export function AdminUsers() {
  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="User Management"
        subtitle="View and manage all platform users"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-100">
            {[
              {
                name: 'John Student',
                role: 'Customer',
                status: 'Active',
                joined: '2025-01-15',
              },
              {
                name: 'Daniel Okonkwo',
                role: 'Provider',
                status: 'Active',
                joined: '2024-09-15',
              },
              {
                name: 'Sarah Adeyemi',
                role: 'Provider',
                status: 'Active',
                joined: '2024-08-20',
              },
              {
                name: 'Chioma Obi',
                role: 'Customer',
                status: 'Active',
                joined: '2025-02-01',
              },
              {
                name: 'Blessing Adebayo',
                role: 'Provider',
                status: 'Pending',
                joined: '2025-02-01',
              },
            ].map((user, i) => (
              <tr key={i} className="hover:bg-ink-50">
                <td className="p-4 font-medium text-ink-900 dark:text-ink-50">
                  {user.name}
                </td>

                <td className="p-4 text-ink-600">
                  {user.role}
                </td>

                <td className="p-4">
                  <span
                    className={`badge ${
                      user.status === 'Active'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-accent-100 text-accent-700'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="p-4 text-ink-400">
                  {user.joined}
                </td>

                <td className="p-4 text-right">
                  <button className="btn-ghost btn-sm">
                    <Eye className="h-4 w-4" />
                  </button>

                  <button className="btn-ghost btn-sm text-red-600">
                    <Ban className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}