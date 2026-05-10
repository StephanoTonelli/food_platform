import { notFound } from "next/navigation";
import { PublicHeader } from "~/components/layout/public-header";
import { EventStatusBadge } from "~/components/ui/badge";
import { api } from "~/trpc/server";
import { formatDate, formatPrice } from "~/lib/utils";
import { OrderForm } from "~/components/order-form";

interface Props {
  params: Promise<{ businessSlug: string; eventId: string }>;
}

export default async function EventPage({ params }: Props) {
  const { businessSlug, eventId } = await params;

  const [event, business] = await Promise.all([
    api.event.getById({ id: eventId }),
    api.business.getBySlug({ slug: businessSlug }),
  ]);

  if (!event || !business || event.businessId !== business.id) notFound();

  const isOrderable = event.status === "OPEN" || event.status === "ANNOUNCED";

  const itemsByCategory = event.eventMenuItems.reduce(
    (acc, emi) => {
      const catName = emi.menuItem.category?.name ?? "Other";
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(emi);
      return acc;
    },
    {} as Record<string, typeof event.eventMenuItems>,
  );

  return (
    <>
      <PublicHeader
        businessName={business.name}
        businessSlug={businessSlug}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-2 flex items-center gap-3">
              <EventStatusBadge status={event.status} />
              <span className="text-sm text-gray-500">{business.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            {event.description && (
              <p className="mt-2 text-gray-600">{event.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                📅 {formatDate(event.eventDate)}
              </span>
              {event.collectionPoint && (
                <span className="flex items-center gap-1">
                  📍 {event.collectionPoint}
                </span>
              )}
              {event.collectionTime && (
                <span className="flex items-center gap-1">
                  🕐 Collection: {event.collectionTime}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Event Menu
              </h2>
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {items.map((emi) => {
                      const price =
                        emi.priceOverride ?? emi.menuItem.price;
                      return (
                        <div
                          key={emi.id}
                          className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {emi.menuItem.name}
                            </p>
                            {emi.menuItem.description && (
                              <p className="mt-0.5 text-sm text-gray-500">
                                {emi.menuItem.description}
                              </p>
                            )}
                            {!emi.isAvailable && (
                              <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <span className="ml-4 text-base font-semibold text-orange-600">
                            {formatPrice(price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {event.eventMenuItems.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  No menu items for this event yet.
                </div>
              )}
            </div>

            <div>
              {isOrderable ? (
                <OrderForm
                  event={event}
                  business={business}
                  menuItems={event.eventMenuItems
                    .filter((emi) => emi.isAvailable)
                    .map((emi) => ({
                      id: emi.menuItem.id,
                      name: emi.menuItem.name,
                      price: emi.priceOverride ?? emi.menuItem.price,
                      description: emi.menuItem.description,
                    }))}
                />
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <div className="mb-3 text-4xl">🔒</div>
                  <h3 className="font-semibold text-gray-900">
                    Orders are not currently open
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    This event is{" "}
                    {event.status === "CLOSED" ? "closed" : "not yet open"} for
                    orders.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
