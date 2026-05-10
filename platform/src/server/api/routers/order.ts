import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { stripe } from "~/lib/stripe";
import {
  createTRPCRouter,
  publicProcedure,
  vendorProcedure,
} from "../trpc";

export const orderRouter = createTRPCRouter({
  listByEvent: vendorProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z
          .array(
            z.enum([
              "PENDING_PAYMENT",
              "PENDING_CONFIRMATION",
              "CONFIRMED",
              "COMPLETED",
              "CANCELLED",
            ]),
          )
          .optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.order.findMany({
        where: {
          eventId: input.eventId,
          ...(input.status ? { status: { in: input.status } } : {}),
        },
        include: {
          items: { include: { menuItem: true } },
          payment: true,
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  listByBusiness: vendorProcedure
    .input(
      z.object({
        status: z
          .array(
            z.enum([
              "PENDING_PAYMENT",
              "PENDING_CONFIRMATION",
              "CONFIRMED",
              "COMPLETED",
              "CANCELLED",
            ]),
          )
          .optional(),
      }),
    )
    .query(({ ctx, input }) => {
      if (!ctx.business) return [];
      return ctx.db.order.findMany({
        where: {
          businessId: ctx.business.id,
          ...(input.status ? { status: { in: input.status } } : {}),
        },
        include: {
          items: { include: { menuItem: true } },
          event: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  createStripeCheckout: publicProcedure
    .input(
      z.object({
        businessId: z.string(),
        eventId: z.string().optional(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            menuItemId: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().int().positive(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.business.findUnique({
        where: { id: input.businessId },
      });
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const event = input.eventId
        ? await ctx.db.event.findUnique({ where: { id: input.eventId } })
        : null;

      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const depositAmount = Math.ceil(totalAmount / 2);

      const menuItems = await ctx.db.menuItem.findMany({
        where: { id: { in: input.items.map((i) => i.menuItemId) } },
      });

      const order = await ctx.db.order.create({
        data: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          status: "PENDING_PAYMENT",
          paymentMethod: "STRIPE",
          depositAmount,
          totalAmount,
          businessId: input.businessId,
          eventId: input.eventId,
          collectionPoint: event?.collectionPoint,
          collectionTime: event?.collectionTime,
          items: {
            create: input.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: input.customerEmail,
        line_items: [
          {
            price_data: {
              currency: "aud",
              product_data: {
                name: `50% Deposit — ${business.name}${event ? ` (${event.title})` : ""}`,
                description: input.items
                  .map((item) => {
                    const mi = menuItems.find((m) => m.id === item.menuItemId);
                    return `${item.quantity}x ${mi?.name ?? item.menuItemId}`;
                  })
                  .join(", "),
              },
              unit_amount: depositAmount,
            },
            quantity: 1,
          },
        ],
        metadata: { orderId: order.id },
        success_url: `${env.NEXT_PUBLIC_APP_URL}/${business.slug}/order-confirmed?orderId=${order.id}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${business.slug}${input.eventId ? `/events/${input.eventId}` : ""}`,
      });

      await ctx.db.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return { checkoutUrl: session.url, orderId: order.id };
    }),

  createBankTransferOrder: publicProcedure
    .input(
      z.object({
        businessId: z.string(),
        eventId: z.string().optional(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            menuItemId: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().int().positive(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.business.findUnique({
        where: { id: input.businessId },
      });
      if (!business) throw new TRPCError({ code: "NOT_FOUND" });

      const event = input.eventId
        ? await ctx.db.event.findUnique({ where: { id: input.eventId } })
        : null;

      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const depositAmount = Math.ceil(totalAmount / 2);

      const order = await ctx.db.order.create({
        data: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          status: "PENDING_CONFIRMATION",
          paymentMethod: "BANK_TRANSFER",
          depositAmount,
          totalAmount,
          businessId: input.businessId,
          eventId: input.eventId,
          collectionPoint: event?.collectionPoint,
          collectionTime: event?.collectionTime,
          items: {
            create: input.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      return { orderId: order.id };
    }),

  confirmBankTransfer: vendorProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.business && order.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.order.update({
        where: { id: input.orderId },
        data: {
          status: "CONFIRMED",
          payment: {
            create: {
              amount: order.depositAmount,
              status: "paid",
              method: "BANK_TRANSFER",
              paidAt: new Date(),
            },
          },
        },
      });
    }),

  updateStatus: vendorProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "PENDING_PAYMENT",
          "PENDING_CONFIRMATION",
          "CONFIRMED",
          "COMPLETED",
          "CANCELLED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.business && order.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
      });
    }),

  updateProductionStatus: vendorProcedure
    .input(
      z.object({
        orderId: z.string(),
        columnId: z.string(),
        value: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const current =
        (order.productionStatus as Record<string, boolean> | null) ?? {};
      current[input.columnId] = input.value;

      return ctx.db.order.update({
        where: { id: input.orderId },
        data: { productionStatus: current },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          items: { include: { menuItem: true } },
          event: true,
          business: true,
          payment: true,
        },
      });
    }),
});
