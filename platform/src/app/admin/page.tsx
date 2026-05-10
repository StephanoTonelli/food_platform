import { api } from "~/trpc/server";
import { Card, CardContent } from "~/components/ui/card";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const businesses = await api.business.listAll();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="mt-1 text-gray-500">Overview of all vendor accounts</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <p className="text-3xl font-bold text-gray-900">{businesses.length}</p>
            <p className="text-sm text-gray-500">Total Businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-3xl font-bold text-gray-900">
              {businesses.filter((b) => b.isActive).length}
            </p>
            <p className="text-sm text-gray-500">Active Businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-3xl font-bold text-gray-900">
              {businesses.filter((b) => b.vendorId).length}
            </p>
            <p className="text-sm text-gray-500">With Assigned Vendor</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Businesses</h2>
        <Link
          href="/admin/vendors/new"
          className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          + New Business
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Business</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Vendor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Modes</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {businesses.map((business) => (
              <tr key={business.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {business.name}
                </td>
                <td className="px-4 py-3 text-gray-500">/{business.slug}</td>
                <td className="px-4 py-3 text-gray-500">
                  {business.vendor?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {[
                    business.isEventMode && "Event",
                    business.isDailyMode && "Daily",
                    business.isOnlineOnly && "Online",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      business.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {business.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400">
            No businesses yet.
          </div>
        )}
      </div>
    </div>
  );
}
