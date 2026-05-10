"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [safetyBufferPct, setSafetyBufferPct] = useState("");

  const create = api.event.create.useMutation({
    onSuccess: (event) => {
      router.push(`/dashboard/events/${event.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      title,
      description: description || undefined,
      eventDate: new Date(eventDate),
      collectionPoint: collectionPoint || undefined,
      collectionTime: collectionTime || undefined,
      safetyBufferPct: safetyBufferPct ? parseInt(safetyBufferPct) : undefined,
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up a new batch production event
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Event title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Saturday Batch — June 2025"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about this batch..."
            />
            <Input
              label="Event date"
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="Collection point"
              value={collectionPoint}
              onChange={(e) => setCollectionPoint(e.target.value)}
              placeholder="123 Main St, Sydney"
            />
            <Input
              label="Collection time"
              value={collectionTime}
              onChange={(e) => setCollectionTime(e.target.value)}
              placeholder="2:00 PM – 4:00 PM"
            />
            <Input
              label="Safety buffer %"
              type="number"
              min="0"
              max="100"
              value={safetyBufferPct}
              onChange={(e) => setSafetyBufferPct(e.target.value)}
              placeholder="20 (uses business default if empty)"
              hint="Extra ingredient buffer added to confirmed orders"
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                loading={create.isPending}
              >
                Create Event
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
