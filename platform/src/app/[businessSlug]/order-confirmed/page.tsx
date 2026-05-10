import Link from "next/link";
import { api } from "~/trpc/server";
import { PublicHeader } from "~/components/layout/public-header";
import { OrderStatusBadge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/utils";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderConfirmedPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { orderId } = await searchParams;

  const [business, order] = await Promise.all([
    api.business.getBySlug({ slug: businessSlug }),
    orderId ? api.order.getById({ id: orderId }) : Promise.resolve(null),
  ]);

  return (
    <>
      <PublicHeader businessName={business?.name} businessSlug={businessSlug} />
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-gray-600">
              Thank you for your order. We&apos;ll see you on the day!
            </p>
          </div>

          {order && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Order status
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {item.quantity}× {item.menuItem.name}
                      </span>
                      <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Total</span>
                    <span className="font-medium">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-700">Deposit paid</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(order.depositAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-gray-500">
                    <span>Remaining at pickup</span>
                    <span>{formatPrice(order.totalAmount - order.depositAmount)}</span>
                  </div>
                </div>
              </div>

              {(order.collectionPoint ?? order.collectionTime) && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
                  <p className="font-medium text-orange-800">
                    Collection details
                  </p>
                  {order.collectionPoint && (
                    <p className="mt-1 text-orange-700">
                      📍 {order.collectionPoint}
                    </p>
                  )}
                  {order.collectionTime && (
                    <p className="mt-1 text-orange-700">
                      🕐 {order.collectionTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Link href={`/${businessSlug}`}>
              <Button variant="secondary" className="w-full">
                Back to {business?.name ?? "store"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
