import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  vendorProcedure,
} from "../trpc";

export const menuRouter = createTRPCRouter({
  getItems: publicProcedure
    .input(z.object({ businessId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.menuItem.findMany({
        where: { businessId: input.businessId, isActive: true },
        include: { category: true, recipe: true },
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      });
    }),

  createItem: vendorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().int().positive(),
        categoryId: z.string().optional(),
        recipeId: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.menuItem.create({
        data: { ...input, businessId: ctx.business.id },
      });
    }),

  updateItem: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().int().positive().optional(),
        categoryId: z.string().nullable().optional(),
        recipeId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const item = await ctx.db.menuItem.findUnique({ where: { id: input.id } });
      if (!item || item.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return ctx.db.menuItem.update({ where: { id }, data });
    }),

  deleteItem: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const item = await ctx.db.menuItem.findUnique({ where: { id: input.id } });
      if (!item || item.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.menuItem.delete({ where: { id: input.id } });
    }),

  createCategory: vendorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const count = await ctx.db.category.count({
        where: { businessId: ctx.business.id },
      });
      return ctx.db.category.create({
        data: {
          ...input,
          businessId: ctx.business.id,
          sortOrder: input.sortOrder ?? count,
        },
      });
    }),

  updateCategory: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return ctx.db.category.update({ where: { id }, data });
    }),

  deleteCategory: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.category.delete({ where: { id: input.id } });
    }),

  getCategories: vendorProcedure.query(({ ctx }) => {
    if (!ctx.business) return [];
    return ctx.db.category.findMany({
      where: { businessId: ctx.business.id },
      orderBy: { sortOrder: "asc" },
    });
  }),
});
