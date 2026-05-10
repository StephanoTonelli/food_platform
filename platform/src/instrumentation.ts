export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DEV_MODE !== "true") return;

  const { existsSync, copyFileSync } = await import("fs");
  const { join } = await import("path");

  const dest = "/tmp/dev.db";
  if (existsSync(dest)) return;

  const candidates = [
    join(process.cwd(), "prisma", "dev.db"),
    join("/var/task", "prisma", "dev.db"),
  ];

  for (const src of candidates) {
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`[DEV] Seeded DB copied from ${src}`);
      return;
    }
  }

  console.warn("[DEV] Could not find prisma/dev.db to copy — DB will be empty");
}
