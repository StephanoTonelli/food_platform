import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  vendorProcedure,
} from "../trpc";

export const eventRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          business: true,
          eventMenuItems: {
            where: { isAvailable: true },
            include: {
              menuItem: { include: { category: true } },
            },
          },
          productionColumns: { orderBy: { sortOrder: "asc" } },
        },
      });
    }),

  listByBusiness: publicProcedure
    .input(
      z.object({
        businessId: z.string(),
        status: z
          .array(
            z.enum(["DRAFT", "ANNOUNCED", "OPEN", "CLOSED", "COMPLETED"]),
          )
          .optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.event.findMany({
        where: {
          businessId: input.businessId,
          ...(input.status ? { status: { in: input.status } } : {}),
        },
        include: {
          eventMenuItems: {
            include: { menuItem: true },
          },
          _count: { select: { orders: true } },
        },
        orderBy: { eventDate: "desc" },
      });
    }),

  create: vendorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventDate: z.date(),
        collectionPoint: z.string().optional(),
        collectionTime: z.string().optional(),
        safetyBufferPct: z.number().min(0).max(100).optional(),
        menuItemIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });

      const { menuItemIds, ...eventData } = input;

      const event = await ctx.db.event.create({
        data: {
          ...eventData,
          businessId: ctx.business.id,
          eventMenuItems: menuItemIds?.length
            ? {
                create: menuItemIds.map((menuItemId) => ({ menuItemId })),
              }
            : undefined,
        },
        include: { eventMenuItems: true },
      });

      return event;
    }),

  update: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        eventDate: z.date().optional(),
        status: z
          .enum(["DRAFT", "ANNOUNCED", "OPEN", "CLOSED", "COMPLETED"])
          .optional(),
        collectionPoint: z.string().optional(),
        collectionTime: z.string().optional(),
        safetyBufferPct: z.number().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event || event.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return ctx.db.event.update({ where: { id }, data });
    }),

  delete: vendorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const event = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!event || event.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.event.delete({ where: { id: input.id } });
    }),

  updateMenuItems: vendorProcedure
    .input(
      z.object({
        eventId: z.string(),
        menuItemIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
      });
      if (!event || event.businessId !== ctx.business.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.eventMenuItem.deleteMany({
        where: { eventId: input.eventId },
      });

      await ctx.db.eventMenuItem.createMany({
        data: input.menuItemIds.map((menuItemId) => ({
          eventId: input.eventId,
          menuItemId,
        })),
      });

      return ctx.db.event.findUnique({
        where: { id: input.eventId },
        include: { eventMenuItems: { include: { menuItem: true } } },
      });
    }),

  addProductionColumn: vendorProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.business) throw new TRPCError({ code: "FORBIDDEN" });
      const count = await ctx.db.productionColumn.count({
        where: { eventId: input.eventId },
      });
      return ctx.db.productionColumn.create({
        data: { ...input, sortOrder: count },
      });
    }),

  deleteProductionColumn: vendorProcedure
    .input(z.object({ columnId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.productionColumn.delete({
        where: { id: input.columnId },
      });
    }),
});
