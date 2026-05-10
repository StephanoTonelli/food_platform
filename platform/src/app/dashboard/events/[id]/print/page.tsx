"use client";

import { useParams } from "next/navigation";
import { useRef } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";

export default function PrintOrderSheetPage() {
  const params = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: event } = api.event.getById.useQuery({ id: params.id });
  const { data: orders } = api.order.listByEvent.useQuery({ eventId: params.id });
  const updateProductionStatus = api.order.updateProductionStatus.useMutation();

  function handlePrint() {
    window.print();
  }

  if (!event || !orders) {
    return <div className="py-20 text-center text-gray-400">Loading…</div>;
  }

  const columns = event.productionColumns;
  const menuItems = event.eventMenuItems.map((emi) => emi.menuItem);

  const confirmedOrders = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "COMPLETED",
  );

  const totalsPerItem = menuItems.map((item) => ({
    item,
    total: confirmedOrders.reduce((sum, order) => {
      const oi = order.items.find((i) => i.menuItemId === item.id);
      return sum + (oi?.quantity ?? 0);
    }, 0),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Sheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            {event.title} — {formatDate(event.eventDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>🖨️ Print</Button>
        </div>
      </div>

      <div ref={printRef} className="bg-white">
        <div className="mb-6 border-b border-gray-300 pb-4">
          <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
          <p className="text-sm text-gray-600">{formatDate(event.eventDate)}</p>
          {event.collectionPoint && (
            <p className="text-sm text-gray-600">📍 {event.collectionPoint}</p>
          )}
          {event.collectionTime && (
            <p className="text-sm text-gray-600">🕐 {event.collectionTime}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Confirmed orders: {confirmedOrders.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                  Customer
                </th>
                {menuItems.map((item) => (
                  <th
                    key={item.id}
                    className="border border-gray-300 px-3 py-2 text-center font-semibold"
                  >
                    {item.name}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  Payment
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="border border-gray-300 px-3 py-2 text-center font-semibold"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confirmedOrders.map((order) => {
                const production =
                  (order.productionStatus as Record<string, boolean> | null) ??
                  {};
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      <p className="font-medium">{order.customerName}</p>
                      {order.notes && (
                        <p className="text-xs text-gray-500">{order.notes}</p>
                      )}
                    </td>
                    {menuItems.map((item) => {
                      const oi = order.items.find(
                        (i) => i.menuItemId === item.id,
                      );
                      return (
                        <td
                          key={item.id}
                          className="border border-gray-300 px-3 py-2 text-center"
                        >
                          {oi?.quantity ?? "—"}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                      <span
                        className={
                          order.paymentMethod === "STRIPE"
                            ? "text-green-600"
                            : "text-orange-600"
                        }
                      >
                        {order.paymentMethod === "STRIPE" ? "✓ Paid" : "⏳ Transfer"}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className="border border-gray-300 px-3 py-2 text-center"
                      >
                        <input
                          type="checkbox"
                          checked={production[col.id] ?? false}
                          onChange={(e) =>
                            updateProductionStatus.mutate({
                              orderId: order.id,
                              columnId: col.id,
                              value: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-orange-500 print:hidden"
                        />
                        <span className="hidden print:inline">
                          {production[col.id] ? "✓" : ""}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-3 py-2">TOTALS</td>
                {totalsPerItem.map(({ item, total }) => (
                  <td
                    key={item.id}
                    className="border border-gray-300 px-3 py-2 text-center"
                  >
                    {total}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center text-xs">
                  {confirmedOrders.filter(
                    (o) => o.paymentMethod === "STRIPE",
                  ).length}{" "}
                  paid /{" "}
                  {confirmedOrders.filter(
                    (o) => o.paymentMethod === "BANK_TRANSFER",
                  ).length}{" "}
                  transfer
                </td>
                {columns.map((col) => {
                  const colId = col.id;
                  const doneCount = confirmedOrders.filter(
                    (o) =>
                      ((o.productionStatus as Record<string, boolean> | null) ??
                        {})[colId],
                  ).length;
                  return (
                    <td
                      key={col.id}
                      className="border border-gray-300 px-3 py-2 text-center"
                    >
                      {doneCount}/{confirmedOrders.length}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #__next * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:inline { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
