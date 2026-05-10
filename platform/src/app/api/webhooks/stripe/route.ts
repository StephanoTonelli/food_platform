import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { stripe } from "~/lib/stripe";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        stripePaymentIntentId: session.payment_intent as string | undefined,
        payment: {
          create: {
            amount: order.depositAmount,
            status: "paid",
            method: "STRIPE",
            stripePaymentId: session.payment_intent as string | undefined,
            paidAt: new Date(),
          },
        },
      },
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await db.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
