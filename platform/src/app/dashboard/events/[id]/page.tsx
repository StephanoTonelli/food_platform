"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EventStatusBadge, OrderStatusBadge } from "~/components/ui/badge";
import { formatDate, formatPrice } from "~/lib/utils";
import { Input } from "~/components/ui/input";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ANNOUNCED", label: "Announced" },
  { value: "OPEN", label: "Open for orders" },
  { value: "CLOSED", label: "Closed" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [newColumnName, setNewColumnName] = useState("");

  const { data: event, refetch } = api.event.getById.useQuery({ id: params.id });
  const { data: orders } = api.order.listByEvent.useQuery({ eventId: params.id });
  const updateEvent = api.event.update.useMutation({ onSuccess: () => refetch() });
  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => router.push("/dashboard/events"),
  });
  const confirmBankTransfer = api.order.confirmBankTransfer.useMutation({
    onSuccess: () => refetch(),
  });
  const addColumn = api.event.addProductionColumn.useMutation({
    onSuccess: () => { refetch(); setNewColumnName(""); },
  });
  const deleteColumn = api.event.deleteProductionColumn.useMutation({
    onSuccess: () => refetch(),
  });
  const updateProductionStatus = api.order.updateProductionStatus.useMutation();

  if (!event) return <div className="py-20 text-center text-gray-400">Loading…</div>;

  const confirmedOrders = orders?.filter(
    (o) => o.status === "CONFIRMED" || o.status === "COMPLETED",
  ) ?? [];

  function handleStatusChange(status: string) {
    updateEvent.mutate({ id: event!.id, status: status as "DRAFT" | "ANNOUNCED" | "OPEN" | "CLOSED" | "COMPLETED" });
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/events"
            className="mb-1 block text-sm text-gray-500 hover:text-gray-700"
          >
            ← Events
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(event.eventDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EventStatusBadge status={event.status} />
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total orders", value: orders?.length ?? 0 },
          { label: "Confirmed", value: confirmedOrders.length },
          { label: "Pending", value: orders?.filter((o) => o.status === "PENDING_CONFIRMATION").length ?? 0 },
          {
            label: "Revenue (deposits)",
            value: formatPrice(confirmedOrders.reduce((s, o) => s + o.depositAmount, 0)),
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex gap-3">
        <Link href={`/dashboard/events/${event.id}/orders`}>
          <Button variant="secondary">View Orders</Button>
        </Link>
        <Link href={`/dashboard/events/${event.id}/print`}>
          <Button variant="secondary">🖨️ Print Sheet</Button>
        </Link>
        <Link href={`/dashboard/events/${event.id}/shopping-list`}>
          <Button variant="secondary">🛒 Shopping List</Button>
        </Link>
        <button
          onClick={() => {
            if (confirm("Delete this event? This cannot be undone.")) {
              deleteEvent.mutate({ id: event.id });
            }
          }}
          className="ml-auto text-sm text-red-500 hover:text-red-700"
        >
          Delete event
        </button>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Menu Items</CardTitle>
              <Link href={`/dashboard/events/${event.id}/menu`}>
                <Button variant="secondary" size="sm">
                  Edit menu
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {event.eventMenuItems.length === 0 ? (
              <p className="text-sm text-gray-500">
                No menu items added yet.{" "}
                <Link
                  href={`/dashboard/events/${event.id}/menu`}
                  className="text-orange-600 hover:underline"
                >
                  Add items
                </Link>
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {event.eventMenuItems.map((emi) => (
                  <div
                    key={emi.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-800">{emi.menuItem.name}</span>
                    <span className="font-medium text-orange-600">
                      {formatPrice(emi.priceOverride ?? emi.menuItem.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Production Columns</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {event.productionColumns.map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
              >
                {col.name}
                <button
                  onClick={() => deleteColumn.mutate({ columnId: col.id })}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Column name (e.g. Made, Boxed, Collected)"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (newColumnName.trim()) {
                  addColumn.mutate({ eventId: event.id, name: newColumnName });
                }
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {orders?.some((o) => o.status === "PENDING_CONFIRMATION") && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bank Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders
                  .filter((o) => o.status === "PENDING_CONFIRMATION")
                  .map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Deposit: {formatPrice(order.depositAmount)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          confirmBankTransfer.mutate({ orderId: order.id })
                        }
                        loading={confirmBankTransfer.isPending}
                      >
                        Confirm
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
