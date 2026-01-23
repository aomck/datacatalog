import { redirect } from 'next/navigation';
import { getMeAction, getPermissionAction } from '@/lib/auth-actions';
import { PermissionProvider } from '@/components/providers/permission-provider';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ensureUserExists } from '@/lib/actions/user-actions';
import type { PermissionResponse } from '@/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const user = await getMeAction();

  if (!user) {
    redirect('/login');
  }

  // Ensure user exists in local database
  await ensureUserExists(user.id);

  // Get permissions for all routes and merge them
  // According to AUTH_PERM_DOC.md, we need to call /permission/:service/:route for each route
  const [catalogPerms, approvePerms, adminPerms] = await Promise.all([
    getPermissionAction('datacatalog', 'catalog'),
    getPermissionAction('datacatalog', 'approve'),
    getPermissionAction('datacatalog', 'admin'),
  ]);

  // Merge all permissions into one object
  const permissions: PermissionResponse | null = catalogPerms || approvePerms || adminPerms ? {
    request_by: (catalogPerms?.request_by || approvePerms?.request_by || adminPerms?.request_by)!,
    action_permission: {
      datacatalog: {
        catalog: catalogPerms?.action_permission?.datacatalog?.catalog || {},
        approve: approvePerms?.action_permission?.datacatalog?.approve || {},
        admin: adminPerms?.action_permission?.datacatalog?.admin || {},
      },
    },
    data_permission: {
      datacatalog: {
        catalog: catalogPerms?.data_permission?.datacatalog?.catalog || {},
        approve: approvePerms?.data_permission?.datacatalog?.approve || {},
        admin: adminPerms?.data_permission?.datacatalog?.admin || {},
      },
    },
  } : null;

  return (
    <PermissionProvider user={user} permissions={permissions}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </PermissionProvider>
  );
}
