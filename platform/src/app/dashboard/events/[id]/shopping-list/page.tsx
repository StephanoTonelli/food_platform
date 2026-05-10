"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/utils";

export default function ShoppingListPage() {
  const params = useParams<{ id: string }>();
  const { data: event } = api.event.getById.useQuery({ id: params.id });
  const { data: list } = api.ingredient.getShoppingList.useQuery({
    eventId: params.id,
  });

  function handlePrint() {
    window.print();
  }

  if (!event || !list) {
    return <div className="py-20 text-center text-gray-400">Loading…</div>;
  }

  const totalEstimatedCost = list.reduce(
    (sum, item) => sum + (item.estimatedCost ?? 0),
    0,
  );
  const hasCost = list.some((item) => item.estimatedCost !== null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ingredient Shopping List
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {event.title} — {formatDate(event.eventDate)}
          </p>
          <p className="text-xs text-gray-400">
            Based on confirmed orders only. Safety buffer: {list[0]?.bufferPct ?? 20}%
          </p>
        </div>
        <Button onClick={handlePrint}>🖨️ Print</Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          <div className="mb-3 text-4xl">🛒</div>
          <p className="font-medium">No shopping list yet</p>
          <p className="mt-1 text-sm">
            Confirm orders for this event and link recipes to menu items to
            generate the shopping list.
          </p>
        </div>
      ) : (
        <div className="bg-white">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h2 className="font-bold text-gray-900">{event.title}</h2>
            <p className="text-sm text-gray-500">{formatDate(event.eventDate)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Ingredient
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Base Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Buffer ({list[0]?.bufferPct ?? 20}%)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Total to Buy
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    Unit
                  </th>
                  {hasCost && (
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Est. Cost
                    </th>
                  )}
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold print:hidden">
                    Got it?
                  </th>
                </tr>
              </thead>
              <tbody>
                {list
                  .sort((a, b) =>
                    a.ingredient.name.localeCompare(b.ingredient.name),
                  )
                  .map(({ ingredient, baseQty, bufferQty, totalQty, estimatedCost }) => (
                    <tr key={ingredient.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {ingredient.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-gray-600">
                        {baseQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-gray-500">
                        +{bufferQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-orange-700">
                        {totalQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        {ingredient.unit}
                      </td>
                      {hasCost && (
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {estimatedCost
                            ? `$${estimatedCost.toFixed(2)}`
                            : "—"}
                        </td>
                      )}
                      <td className="border border-gray-300 px-4 py-2 text-center print:hidden">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-orange-500"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
              {hasCost && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td
                      colSpan={hasCost ? 5 : 4}
                      className="border border-gray-300 px-4 py-2 text-right"
                    >
                      Total estimated cost
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ${totalEstimatedCost.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 print:hidden" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
