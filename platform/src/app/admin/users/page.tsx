import { api } from "~/trpc/server";
import { Badge } from "~/components/ui/badge";

export default async function AdminUsersPage() {
  const users = await api.user.listAll();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">All platform users</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Business</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      user.role === "PLATFORM_ADMIN"
                        ? "danger"
                        : user.role === "VENDOR"
                          ? "brand"
                          : "default"
                    }
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {user.managedBusiness?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString("en-AU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400">
            No users yet.
          </div>
        )}
      </div>
    </div>
  );
}
