import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { slugify } from "~/lib/utils";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
  vendorProcedure,
} from "../trpc";

export const businessRouter = createTRPCRouter({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.business.findUnique({
        where: { slug: input.slug, isActive: true },
        include: {
          categories: { orderBy: { sortOrder: "asc" } },
          menuItems: {
            where: { isActive: true },
            include: { category: true },
            orderBy: { name: "asc" },
          },
          events: {
            where: { status: { in: ["ANNOUNCED", "OPEN"] } },
            orderBy: { eventDate: "asc" },
            take: 10,
          },
        },
      });
    }),

  getMyBusiness: vendorProcedure.query(({ ctx }) => {
    if (!ctx.business) return null;
    return ctx.db.business.findUnique({
      where: { id: ctx.business.id },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        menuItems: { include: { category: true, recipe: true } },
        events: { orderBy: { eventDate: "desc" } },
      },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        vendorId: z.string().optional(),
        isEventMode: z.boolean().default(true),
        isDailyMode: z.boolean().default(false),
        isOnlineOnly: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name);
      const existing = await ctx.db.business.findUnique({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      return ctx.db.business.create({
        data: {
          ...input,
          slug: finalSlug,
        },
      });
    }),

  update: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        isEventMode: z.boolean().optional(),
        isDailyMode: z.boolean().optional(),
        isOnlineOnly: z.boolean().optional(),
        safetyBufferPct: z.number().min(0).max(100).optional(),
        logoUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.business &&
        ctx.business.id !== input.id &&
        ctx.user.role !== "PLATFORM_ADMIN"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return ctx.db.business.update({ where: { id }, data });
    }),

  listAll: adminProcedure.query(({ ctx }) => {
    return ctx.db.business.findMany({
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});
