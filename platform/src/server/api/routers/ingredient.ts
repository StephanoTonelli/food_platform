import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, vendorProcedure } from "../trpc";

export const ingredientRouter = createTRPCRouter({
  list: vendorProcedure.query(({ ctx }) => {
    if (!ctx.business) return [];
    return ctx.db.ingredient.findMany({
      where: { businessId: ctx.business.id },
      orderBy: { name: "asc" },
    });
  }),

  create: vendorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        unit: z.string().min(1),
        unitCost: z.number().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.ingredient.create({
        data: { ...input, businessId: ctx.business.id },
      });
    }),

  update: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        unit: z.string().min(1).optional(),
        unitCost: z.number().positive().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return ctx.db.ingredient.update({ where: { id }, data });
    }),

  delete: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.ingredient.delete({ where: { id: input.id } });
    }),

  getShoppingList: vendorProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });

      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        include: { business: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const confirmedOrders = await ctx.db.order.findMany({
        where: {
          eventId: input.eventId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  recipe: {
                    include: {
                      ingredients: { include: { ingredient: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const ingredientTotals = new Map<
        string,
        {
          ingredient: { id: string; name: string; unit: string; unitCost: number | null };
          baseQty: number;
        }
      >();

      for (const order of confirmedOrders) {
        for (const item of order.items) {
          const recipe = item.menuItem.recipe;
          if (!recipe) continue;

          for (const ri of recipe.ingredients) {
            const qtyNeeded =
              (ri.quantity / recipe.servingQty) * item.quantity;

            const existing = ingredientTotals.get(ri.ingredientId);
            if (existing) {
              existing.baseQty += qtyNeeded;
            } else {
              ingredientTotals.set(ri.ingredientId, {
                ingredient: ri.ingredient,
                baseQty: qtyNeeded,
              });
            }
          }
        }
      }

      const bufferPct =
        event.safetyBufferPct ?? event.business.safetyBufferPct;

      return Array.from(ingredientTotals.values()).map(
        ({ ingredient, baseQty }) => {
          const bufferQty = baseQty * (bufferPct / 100);
          const totalQty = baseQty + bufferQty;
          const estimatedCost = ingredient.unitCost
            ? totalQty * ingredient.unitCost
            : null;
          return {
            ingredient,
            baseQty: Math.ceil(baseQty * 100) / 100,
            bufferQty: Math.ceil(bufferQty * 100) / 100,
            totalQty: Math.ceil(totalQty * 100) / 100,
            estimatedCost,
            bufferPct,
          };
        },
      );
    }),
});
