"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import { formatPrice } from "~/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
}

interface OrderFormProps {
  event: { id: string; collectionPoint?: string | null; collectionTime?: string | null };
  business: { id: string; slug: string };
  menuItems: MenuItem[];
}

type Quantities = Record<string, number>;

export function OrderForm({ event, business, menuItems }: OrderFormProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Quantities>({});
  const [step, setStep] = useState<"menu" | "details">("menu");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "BANK_TRANSFER">("STRIPE");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bankTransferOrderId, setBankTransferOrderId] = useState<string | null>(null);

  const stripeCheckout = api.order.createStripeCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  const bankTransfer = api.order.createBankTransferOrder.useMutation({
    onSuccess: (data) => {
      setBankTransferOrderId(data.orderId);
    },
  });

  const selectedItems = menuItems.filter((item) => (quantities[item.id] ?? 0) > 0);
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0,
  );
  const depositAmount = Math.ceil(totalAmount / 2);

  function setQty(itemId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, qty) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = selectedItems.map((item) => ({
      menuItemId: item.id,
      quantity: quantities[item.id] ?? 0,
      unitPrice: item.price,
    }));

    const base = {
      businessId: business.id,
      eventId: event.id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      notes: notes || undefined,
      items,
    };

    if (paymentMethod === "STRIPE") {
      stripeCheckout.mutate(base);
    } else {
      bankTransfer.mutate(base);
    }
  }

  if (bankTransferOrderId) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="text-lg font-semibold text-green-900">
          Order received!
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Your order has been placed and is awaiting confirmation. We&apos;ll
          confirm once we receive your bank transfer.
        </p>
        <div className="mt-4 rounded-lg bg-white p-4 text-sm">
          <p className="font-medium text-gray-700">Deposit to pay:</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {formatPrice(depositAmount)}
          </p>
          <p className="mt-2 text-gray-500">
            Please transfer the deposit to complete your order. Reference your
            name in the transfer.
          </p>
        </div>
        {event.collectionPoint && (
          <p className="mt-3 text-sm text-green-700">
            📍 Collection: {event.collectionPoint}
            {event.collectionTime && ` at ${event.collectionTime}`}
          </p>
        )}
      </div>
    );
  }

  if (step === "menu") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Place Your Order
        </h2>

        <div className="mb-4 space-y-3">
          {menuItems.map((item) => {
            const qty = quantities[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-orange-600">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    disabled={qty === 0}
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-medium">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-1 flex justify-between text-sm text-gray-600">
              <span>Order total</span>
              <span className="font-medium">{formatPrice(totalAmount)}</span>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <span className="font-medium text-gray-900">Deposit (50%)</span>
              <span className="font-semibold text-orange-600">
                {formatPrice(depositAmount)}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={() => setStep("details")}
            >
              Continue to checkout
            </Button>
          </div>
        )}

        {selectedItems.length === 0 && (
          <p className="text-center text-sm text-gray-400">
            Select items to place an order
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <button
        type="button"
        onClick={() => setStep("menu")}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to menu
      </button>

      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Your Details
      </h2>

      <div className="mb-6 space-y-4">
        <Input
          label="Full name"
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Jane Smith"
        />
        <Input
          label="Email address"
          type="email"
          required
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="jane@example.com"
        />
        <Input
          label="Phone number"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="+61 400 000 000"
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests..."
        />
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-gray-700">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {(["STRIPE", "BANK_TRANSFER"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                paymentMethod === method
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">
                {method === "STRIPE" ? "💳 Card" : "🏦 Bank Transfer"}
              </div>
              <div className="mt-0.5 text-xs opacity-70">
                {method === "STRIPE"
                  ? "Instant confirmation"
                  : "Pending until confirmed"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
        {selectedItems.map((item) => (
          <div key={item.id} className="flex justify-between text-gray-600">
            <span>
              {quantities[item.id]}× {item.name}
            </span>
            <span>{formatPrice(item.price * (quantities[item.id] ?? 0))}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
          <span>Deposit (50%)</span>
          <span className="text-orange-600">{formatPrice(depositAmount)}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={stripeCheckout.isPending || bankTransfer.isPending}
      >
        {paymentMethod === "STRIPE"
          ? `Pay ${formatPrice(depositAmount)} deposit`
          : "Place order (bank transfer)"}
      </Button>
    </form>
  );
}
