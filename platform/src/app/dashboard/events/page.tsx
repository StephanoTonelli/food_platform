import Link from "next/link";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EventStatusBadge } from "~/components/ui/badge";
import { formatDate } from "~/lib/utils";

export default async function EventsPage() {
  const business = await api.business.getMyBusiness();
  if (!business) return null;

  const events = await api.event.listByBusiness({ businessId: business.id });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your batch production events
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>+ New Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">📅</div>
            <h3 className="font-semibold text-gray-900">No events yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first batch event to start taking orders.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/events/new">
                <Button>Create Event</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <Card className="transition hover:border-orange-200">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-start gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-500">
                      <p>{event._count.orders} orders</p>
                      <p>{event.eventMenuItems.length} items</p>
                    </div>
                    <EventStatusBadge status={event.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
