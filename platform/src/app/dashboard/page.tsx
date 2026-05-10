import { api } from "~/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EventStatusBadge } from "~/components/ui/badge";
import Link from "next/link";
import { formatDate, formatPrice } from "~/lib/utils";

export default async function DashboardPage() {
  const business = await api.business.getMyBusiness();

  if (!business) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-5xl">🏪</div>
        <h2 className="text-xl font-semibold text-gray-900">
          No business found
        </h2>
        <p className="mt-2 text-gray-500">
          Contact your platform administrator to set up your business account.
        </p>
      </div>
    );
  }

  const upcomingEvents = business.events
    .filter((e) => ["DRAFT", "ANNOUNCED", "OPEN"].includes(e.status))
    .sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    )
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {business.name} 👋
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s an overview of your business.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">
              📅
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {business.events.length}
              </p>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">
              📋
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {business.menuItems.length}
              </p>
              <p className="text-sm text-gray-500">Menu Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
              🔗
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Public URL</p>
              <Link
                href={`/${business.slug}`}
                className="text-sm text-orange-600 hover:underline"
                target="_blank"
              >
                /{business.slug}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Events
          </h2>
          <Link
            href="/dashboard/events"
            className="text-sm text-orange-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No upcoming events.{" "}
              <Link
                href="/dashboard/events/new"
                className="text-orange-600 hover:underline"
              >
                Create your first event
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                <Card className="transition hover:border-orange-200">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                    <EventStatusBadge status={event.status} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
