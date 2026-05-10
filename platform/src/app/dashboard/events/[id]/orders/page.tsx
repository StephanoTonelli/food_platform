"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { OrderStatusBadge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";

export default function EventOrdersPage() {
  const params = useParams<{ id: string }>();
  const { data: event } = api.event.getById.useQuery({ id: params.id });
  const { data: orders, refetch } = api.order.listByEvent.useQuery({
    eventId: params.id,
  });
  const confirm = api.order.confirmBankTransfer.useMutation({
    onSuccess: () => refetch(),
  });
  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  if (!orders) return <div className="py-20 text-center text-gray-400">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/events/${params.id}`}
          className="mb-1 block text-sm text-gray-500 hover:text-gray-700"
        >
          ← {event?.title ?? "Event"}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <div className="flex gap-2">
            <Link href={`/dashboard/events/${params.id}/print`}>
              <Button variant="secondary" size="sm">🖨️ Print Sheet</Button>
            </Link>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          No orders yet for this event.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Deposit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-gray-700">
                        {item.quantity}× {item.menuItem.name}
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatPrice(order.depositAmount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.paymentMethod === "STRIPE" ? "💳 Card" : "🏦 Transfer"}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    {order.status === "PENDING_CONFIRMATION" && (
                      <Button
                        size="sm"
                        onClick={() => confirm.mutate({ orderId: order.id })}
                        loading={confirm.isPending}
                      >
                        Confirm
                      </Button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateStatus.mutate({
                            orderId: order.id,
                            status: "COMPLETED",
                          })
                        }
                      >
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
