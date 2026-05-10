"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { OrderStatusBadge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PENDING_CONFIRMATION", label: "Pending Confirmation" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: orders, refetch } = api.order.listByBusiness.useQuery({
    status: statusFilter
      ? [statusFilter as "PENDING_PAYMENT" | "PENDING_CONFIRMATION" | "CONFIRMED" | "COMPLETED" | "CANCELLED"]
      : undefined,
  });

  const confirm = api.order.confirmBankTransfer.useMutation({
    onSuccess: () => refetch(),
  });
  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage orders across all your events
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              statusFilter === f.value
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Event</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
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
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.event?.title ?? "Direct order"}
                    {order.event && (
                      <p className="text-xs text-gray-400">
                        {formatDate(order.event.eventDate)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-xs text-gray-600">
                        {item.quantity}× {item.menuItem.name}
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(order.totalAmount)}
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
                    {(order.status === "PENDING_PAYMENT" || order.status === "PENDING_CONFIRMATION") && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({ orderId: order.id, status: "CANCELLED" })
                        }
                        className="ml-2 text-xs text-red-400 hover:text-red-600"
                      >
                        Cancel
                      </button>
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
