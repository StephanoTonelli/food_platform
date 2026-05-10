"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function NewVendorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [vendorUserId, setVendorUserId] = useState("");
  const [isEventMode, setIsEventMode] = useState(true);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);

  const create = api.business.create.useMutation({
    onSuccess: () => router.push("/admin"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      name,
      description: description || undefined,
      contactEmail: contactEmail || undefined,
      vendorId: vendorUserId || undefined,
      isEventMode,
      isDailyMode,
      isOnlineOnly,
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Business</h1>
        <p className="mt-1 text-sm text-gray-500">
          Onboard a new vendor onto the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Business name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Esfija by Ana"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Contact email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Vendor Clerk User ID"
              value={vendorUserId}
              onChange={(e) => setVendorUserId(e.target.value)}
              placeholder="user_..."
              hint="The Clerk user ID of the vendor who will manage this business"
            />

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Operating modes
              </p>
              {[
                { label: "Event Mode", value: isEventMode, set: setIsEventMode },
                { label: "Daily Operations", value: isDailyMode, set: setIsDailyMode },
                { label: "Online-Only", value: isOnlineOnly, set: setIsOnlineOnly },
              ].map((mode) => (
                <label
                  key={mode.label}
                  className="mb-2 flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={mode.value}
                    onChange={(e) => mode.set(e.target.checked)}
                    className="h-4 w-4 rounded accent-orange-500"
                  />
                  <span className="text-sm text-gray-700">{mode.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={create.isPending}>
                Create Business
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
            {create.error && (
              <p className="text-sm text-red-600">{create.error.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
