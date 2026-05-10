import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "~/components/layout/public-header";
import { EventStatusBadge } from "~/components/ui/badge";
import { api } from "~/trpc/server";
import { formatDate, formatPrice } from "~/lib/utils";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessPage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await api.business.getBySlug({ slug: businessSlug });
  if (!business) notFound();

  const upcomingEvents = business.events.filter(
    (e) => e.status === "ANNOUNCED" || e.status === "OPEN",
  );

  return (
    <>
      <PublicHeader
        businessName={business.name}
        businessSlug={businessSlug}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-bold text-white shadow-md">
                {business.name[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="mt-1 text-gray-600">{business.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                  {business.contactEmail && (
                    <span>✉️ {business.contactEmail}</span>
                  )}
                  {business.contactPhone && (
                    <span>📱 {business.contactPhone}</span>
                  )}
                  {business.address && <span>📍 {business.address}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10">
          {business.isEventMode && (
            <section className="mb-10">
              <h2 className="mb-5 text-xl font-semibold text-gray-900">
                Upcoming Events
              </h2>
              {upcomingEvents.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  No upcoming events at this time. Check back soon!
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/${businessSlug}/events/${event.id}`}
                      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
                          {event.title}
                        </h3>
                        <EventStatusBadge status={event.status} />
                      </div>
                      <p className="mb-3 text-sm text-gray-600">
                        📅 {formatDate(event.eventDate)}
                      </p>
                      {event.collectionPoint && (
                        <p className="text-sm text-gray-500">
                          📍 {event.collectionPoint}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-4 text-sm font-medium text-orange-600">
                        View menu & order →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {(business.isDailyMode || business.isOnlineOnly) &&
            business.menuItems.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-semibold text-gray-900">
                  Our Menu
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {business.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                        {item.category && (
                          <p className="mt-1 text-xs text-gray-400">
                            {item.category.name}
                          </p>
                        )}
                      </div>
                      <span className="ml-4 font-semibold text-orange-600">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </main>
    </>
  );
}
