import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500">
            <span className="text-base font-bold text-white">E</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            Esfija Platform
          </span>
        </div>
        <div className="flex items-center gap-3">
          {userId ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
          Pre-order platform for small food businesses
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
          Manage your food{" "}
          <span className="text-orange-500">pre-orders</span> with ease
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
          Create batch events, manage menus, accept deposits, and print
          production checklists — all in one place. Built for home cooks, batch
          producers, and micro-vendors.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {userId ? (
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Batch Events",
              description:
                "Announce production days, publish your menu, and collect pre-orders with 50% deposits automatically.",
              icon: "📅",
            },
            {
              title: "Recipe Management",
              description:
                "Link menu items to recipes and automatically calculate your ingredient shopping list for each event.",
              icon: "📋",
            },
            {
              title: "Printable Checklists",
              description:
                "Export production checklists and ingredient shopping lists as PDFs ready for the kitchen.",
              icon: "🖨️",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
