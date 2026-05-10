export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DEV_MODE !== "true") return;

  const dest = "/tmp/dev.db";

  try {
    const { existsSync, copyFileSync } = await import("node:fs");
    if (existsSync(dest)) return;

    const cwd = process.cwd();
    for (const src of [`${cwd}/prisma/dev.db`, `/var/task/prisma/dev.db`]) {
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`[DEV] Seeded DB copied from ${src}`);
        return;
      }
    }
    console.warn("[DEV] prisma/dev.db not found — DB will be empty");
  } catch {
    // fs not available in this runtime context
  }
}
