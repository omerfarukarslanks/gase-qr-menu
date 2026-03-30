const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const databaseNodeModulesDir = path.join(workspaceRoot, 'packages', 'database', 'node_modules');
const destinationDir = path.join(databaseNodeModulesDir, '.prisma', 'client');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function resolveGeneratedClientDir() {
  const prismaClientPackagePath = require.resolve('@prisma/client/package.json', {
    paths: [databaseNodeModulesDir],
  });
  const realPackagePath = fs.realpathSync(prismaClientPackagePath);
  const packageDir = path.dirname(realPackagePath);

  return path.resolve(packageDir, '..', '..', '.prisma', 'client');
}

function syncPrismaClient() {
  const sourceDir = resolveGeneratedClientDir();

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Generated Prisma client not found: ${sourceDir}`);
  }

  ensureDir(path.dirname(destinationDir));
  removeIfExists(destinationDir);
  fs.symlinkSync(sourceDir, destinationDir, 'dir');

  const relativeSource = path.relative(workspaceRoot, sourceDir);
  console.log(`database prisma client synced -> ${relativeSource}`);
}

try {
  syncPrismaClient();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to sync database Prisma client: ${message}`);
  process.exit(1);
}
