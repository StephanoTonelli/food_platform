import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY ?? "sk_test_devplaceholder";
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

// Lazy proxy so module initialization never throws with a missing/placeholder key
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function centsFromDollars(dollars: number): number {
  return Math.round(dollars * 100);
}
