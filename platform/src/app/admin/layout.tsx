import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const DEV_MODE = process.env.DEV_MODE === "true";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <aside className="flex h-screen w-60 flex-col border-r border-gray-700">
        <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="text-sm font-semibold text-white">Admin</span>
        </div>
        <nav className="flex-1 p-3">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/vendors", label: "Vendors" },
            { href: "/admin/users", label: "Users" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-2">
            {!DEV_MODE && <UserButton />}
            <span className="text-xs text-gray-400">
              {DEV_MODE ? "Dev Mode" : "Platform Admin"}
            </span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
