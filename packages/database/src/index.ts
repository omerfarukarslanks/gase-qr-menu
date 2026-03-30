import { PrismaClient } from "../node_modules/.prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const runtimeProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
const nodeEnv = runtimeProcess?.env?.NODE_ENV;

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      nodeEnv === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export * from "../node_modules/.prisma/client";
