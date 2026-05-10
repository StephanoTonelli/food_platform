"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function SettingsPage() {
  const { data: business, refetch } = api.business.getMyBusiness.useQuery();
  const update = api.business.update.useMutation({ onSuccess: () => refetch() });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [safetyBufferPct, setSafetyBufferPct] = useState("20");
  const [isEventMode, setIsEventMode] = useState(true);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (business) {
      setName(business.name);
      setDescription(business.description ?? "");
      setContactEmail(business.contactEmail ?? "");
      setContactPhone(business.contactPhone ?? "");
      setAddress(business.address ?? "");
      setSafetyBufferPct(String(business.safetyBufferPct));
      setIsEventMode(business.isEventMode);
      setIsDailyMode(business.isDailyMode);
      setIsOnlineOnly(business.isOnlineOnly);
    }
  }, [business]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    update.mutate({
      id: business.id,
      name,
      description: description || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      address: address || undefined,
      safetyBufferPct: parseInt(safetyBufferPct),
      isEventMode,
      isDailyMode,
      isOnlineOnly,
    }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  }

  if (!business) return null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business profile and configuration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Business name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your business" />
            <Input label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Sydney NSW 2000" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "isEventMode", label: "Event Mode", description: "Batch production on announced dates", value: isEventMode, set: setIsEventMode },
              { key: "isDailyMode", label: "Daily Operations", description: "Standard storefront with opening hours", value: isDailyMode, set: setIsDailyMode },
              { key: "isOnlineOnly", label: "Online-Only", description: "No physical opening hours, orders anytime", value: isOnlineOnly, set: setIsOnlineOnly },
            ].map((mode) => (
              <label key={mode.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={mode.value}
                  onChange={(e) => mode.set(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                <div>
                  <p className="font-medium text-gray-800">{mode.label}</p>
                  <p className="text-xs text-gray-500">{mode.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredient Safety Buffer</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Buffer percentage"
              type="number"
              min="0"
              max="100"
              value={safetyBufferPct}
              onChange={(e) => setSafetyBufferPct(e.target.value)}
              hint="Extra ingredients added to shopping list (default 20%). Individual events can override this."
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={update.isPending}>
            Save Changes
          </Button>
          {saved && (
            <span className="text-sm text-green-600">✓ Saved successfully</span>
          )}
        </div>
      </form>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700">Public page URL</p>
        <a
          href={`/${business.slug}`}
          target="_blank"
          className="text-sm text-orange-600 hover:underline"
        >
          {typeof window !== "undefined" ? window.location.origin : ""}/{business.slug}
        </a>
      </div>
    </div>
  );
}
