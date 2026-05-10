import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function main() {
  const adminUser = await db.user.upsert({
    where: { id: "dev_user_admin" },
    update: {},
    create: {
      id: "dev_user_admin",
      email: "dev@esfija.com",
      name: "Dev Admin",
      role: "PLATFORM_ADMIN",
    },
  });

  const vendorUser = await db.user.upsert({
    where: { id: "dev_user_vendor" },
    update: {},
    create: {
      id: "dev_user_vendor",
      email: "ana@esfija.com",
      name: "Ana (Vendor)",
      role: "VENDOR",
    },
  });

  const business = await db.business.upsert({
    where: { slug: "esfija-by-ana" },
    update: {},
    create: {
      name: "Esfija by Ana",
      slug: "esfija-by-ana",
      description:
        "Authentic Brazilian-style mini pizzas made with love. Pre-order your batch every Saturday!",
      contactEmail: "ana@esfija.com",
      contactPhone: "+61 400 000 000",
      address: "Sydney, NSW",
      isEventMode: true,
      safetyBufferPct: 20,
      vendorId: vendorUser.id,
    },
  });

  const savory = await db.category.upsert({
    where: { id: "cat-savory" },
    update: {},
    create: {
      id: "cat-savory",
      name: "Savory",
      sortOrder: 0,
      businessId: business.id,
    },
  });

  const sweet = await db.category.upsert({
    where: { id: "cat-sweet" },
    update: {},
    create: {
      id: "cat-sweet",
      name: "Sweet",
      sortOrder: 1,
      businessId: business.id,
    },
  });

  const cheese = await db.menuItem.upsert({
    where: { id: "item-cheese" },
    update: {},
    create: {
      id: "item-cheese",
      name: "Cheese Esfija",
      description: "Classic mozzarella and provolone blend",
      price: 450,
      categoryId: savory.id,
      businessId: business.id,
    },
  });

  const meat = await db.menuItem.upsert({
    where: { id: "item-meat" },
    update: {},
    create: {
      id: "item-meat",
      name: "Meat Esfija",
      description: "Spiced ground beef with herbs",
      price: 500,
      categoryId: savory.id,
      businessId: business.id,
    },
  });

  const choco = await db.menuItem.upsert({
    where: { id: "item-choco" },
    update: {},
    create: {
      id: "item-choco",
      name: "Chocolate Esfija",
      description: "Nutella and condensed milk",
      price: 450,
      categoryId: sweet.id,
      businessId: business.id,
    },
  });

  const event = await db.event.upsert({
    where: { id: "event-demo" },
    update: {},
    create: {
      id: "event-demo",
      title: "Saturday Batch — June 2025",
      description:
        "Our first batch of the season! Limited quantities available.",
      status: "OPEN",
      eventDate: new Date("2025-06-14T10:00:00.000Z"),
      collectionPoint: "123 King St, Sydney",
      collectionTime: "2:00 PM – 4:00 PM",
      safetyBufferPct: 20,
      businessId: business.id,
    },
  });

  for (const item of [cheese, meat, choco]) {
    await db.eventMenuItem.upsert({
      where: {
        eventId_menuItemId: { eventId: event.id, menuItemId: item.id },
      },
      update: {},
      create: { eventId: event.id, menuItemId: item.id },
    });
  }

  for (const col of ["Made", "Boxed", "Collected"]) {
    await db.productionColumn.create({
      data: { name: col, eventId: event.id },
    }).catch(() => null);
  }

  const order = await db.order.upsert({
    where: { id: "order-demo-1" },
    update: {},
    create: {
      id: "order-demo-1",
      customerName: "Maria Santos",
      customerEmail: "maria@example.com",
      customerPhone: "+61 412 345 678",
      status: "CONFIRMED",
      paymentMethod: "STRIPE",
      depositAmount: 1575,
      totalAmount: 3150,
      businessId: business.id,
      eventId: event.id,
      collectionPoint: "123 King St, Sydney",
      collectionTime: "2:00 PM – 4:00 PM",
      items: {
        create: [
          { menuItemId: cheese.id, quantity: 4, unitPrice: 450 },
          { menuItemId: meat.id, quantity: 2, unitPrice: 500 },
          { menuItemId: choco.id, quantity: 2, unitPrice: 450 },
        ],
      },
    },
  });

  await db.order.upsert({
    where: { id: "order-demo-2" },
    update: {},
    create: {
      id: "order-demo-2",
      customerName: "João Oliveira",
      customerEmail: "joao@example.com",
      status: "PENDING_CONFIRMATION",
      paymentMethod: "BANK_TRANSFER",
      depositAmount: 900,
      totalAmount: 1800,
      businessId: business.id,
      eventId: event.id,
      collectionPoint: "123 King St, Sydney",
      collectionTime: "2:00 PM – 4:00 PM",
      items: {
        create: [
          { menuItemId: meat.id, quantity: 2, unitPrice: 500 },
          { menuItemId: cheese.id, quantity: 2, unitPrice: 450 },
        ],
      },
    },
  });

  console.log("✅ Seed complete");
  console.log(`   Business: /${business.slug}`);
  console.log(`   Event: /esfija-by-ana/events/${event.id}`);
  console.log(`   Dashboard: /dashboard`);
  console.log(`   Admin: /admin`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
