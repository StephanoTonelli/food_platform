"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatPrice } from "~/lib/utils";

export default function EventMenuPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: event } = api.event.getById.useQuery({ id: params.id });
  const { data: business } = api.business.getMyBusiness.useQuery();
  const updateMenuItems = api.event.updateMenuItems.useMutation({
    onSuccess: () => router.push(`/dashboard/events/${params.id}`),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (event?.eventMenuItems) {
      setSelected(new Set(event.eventMenuItems.map((emi) => emi.menuItemId)));
    }
  }, [event]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    updateMenuItems.mutate({
      eventId: params.id,
      menuItemIds: Array.from(selected),
    });
  }

  if (!business || !event) return null;

  const menuItems = business.menuItems.filter((m) => m.isActive);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Menu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select which menu items are available for {event.title}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              No menu items found. Add items to your main menu first.
            </p>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-gray-400">
                          {item.category.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    {formatPrice(item.price)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-3">
        <Button onClick={save} loading={updateMenuItems.isPending}>
          Save Menu
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
