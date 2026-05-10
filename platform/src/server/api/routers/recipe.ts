import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, vendorProcedure } from "../trpc";

export const recipeRouter = createTRPCRouter({
  list: vendorProcedure.query(({ ctx }) => {
    if (!ctx.business) return [];
    return ctx.db.recipe.findMany({
      where: { businessId: ctx.business.id },
      include: {
        ingredients: { include: { ingredient: true } },
        menuItems: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  getById: vendorProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: {
          ingredients: {
            include: { ingredient: true },
          },
          menuItems: true,
        },
      });
    }),

  create: vendorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        servingSize: z.string().min(1),
        servingQty: z.number().positive().default(1),
        ingredients: z
          .array(
            z.object({
              ingredientId: z.string(),
              quantity: z.number().positive(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const { ingredients, ...recipeData } = input;

      return ctx.db.recipe.create({
        data: {
          ...recipeData,
          businessId: ctx.business.id,
          ingredients: ingredients?.length
            ? { create: ingredients }
            : undefined,
        },
        include: {
          ingredients: { include: { ingredient: true } },
        },
      });
    }),

  update: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        servingSize: z.string().optional(),
        servingQty: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
      });
      if (!recipe || recipe.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return ctx.db.recipe.update({ where: { id }, data });
    }),

  delete: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.recipe.delete({ where: { id: input.id } });
    }),

  upsertIngredient: vendorProcedure
    .input(
      z.object({
        recipeId: z.string(),
        ingredientId: z.string(),
        quantity: z.number().positive(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.recipeIngredient.upsert({
        where: {
          recipeId_ingredientId: {
            recipeId: input.recipeId,
            ingredientId: input.ingredientId,
          },
        },
        update: { quantity: input.quantity },
        create: input,
      });
    }),

  removeIngredient: vendorProcedure
    .input(
      z.object({
        recipeId: z.string(),
        ingredientId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.recipeIngredient.delete({
        where: {
          recipeId_ingredientId: {
            recipeId: input.recipeId,
            ingredientId: input.ingredientId,
          },
        },
      });
    }),
});
