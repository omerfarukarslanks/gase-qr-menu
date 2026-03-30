const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const mobileRoot = path.join(repoRoot, "apps", "mobile");

function resolvePackageRoot(pkgName, extraPaths = []) {
  const packageJson = require.resolve(`${pkgName}/package.json`, {
    paths: [mobileRoot, ...extraPaths],
  });
  return path.dirname(packageJson);
}

function patchFile(filePath, replacements) {
  const original = fs.readFileSync(filePath, "utf8");
  let next = original;

  for (const { before, after } of replacements) {
    if (next.includes(after)) {
      continue;
    }

    if (!next.includes(before)) {
      throw new Error(
        `Patch uygulanamadi: beklenen blok bulunamadi -> ${path.relative(repoRoot, filePath)}`
      );
    }

    next = next.replace(before, after);
  }

  if (next !== original) {
    fs.writeFileSync(filePath, next);
  }
}

const expoRoot = resolvePackageRoot("expo");
const expoAutolinkingRoot = resolvePackageRoot("expo-modules-autolinking", [
  expoRoot,
]);
const expoConstantsRoot = resolvePackageRoot("expo-constants");
const expoModulesCoreRoot = resolvePackageRoot("expo-modules-core", [expoRoot]);

patchFile(path.join(expoRoot, "scripts", "autolinking.gradle"), [
  {
    before:
      `// Resolve \`expo\` > \`expo-modules-autolinking\` dependency chain\n` +
      `def autolinkingPath = ["node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"]`,
    after:
      `// Resolve \`expo\` > \`expo-modules-autolinking\` dependency chain\n` +
      `def nodeExecutable = System.getProperty('node.binary') ?: System.getenv('NODE_BINARY') ?: 'node'\n` +
      `def autolinkingPath = [nodeExecutable, "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"]`,
  },
]);

patchFile(path.join(expoRoot, "android", "build.gradle"), [
  {
    before:
      `apply plugin: 'com.android.library'\n\n` +
      `// Import autolinking script`,
    after:
      `apply plugin: 'com.android.library'\n\n` +
      `def nodeExecutable = System.getProperty('node.binary') ?: System.getenv('NODE_BINARY') ?: 'node'\n\n` +
      `// Import autolinking script`,
  },
  {
    before:
      `    commandLine("node", "-e", "console.log(require('react-native/package.json').version);")`,
    after:
      `    commandLine(nodeExecutable, "-e", "console.log(require('react-native/package.json').version);")`,
  },
]);

patchFile(
  path.join(
    expoAutolinkingRoot,
    "scripts",
    "android",
    "autolinking_implementation.gradle"
  ),
  [
    {
      before:
        `  static private String[] convertOptionsToCommandArgs(String command, Map options) {\n` +
        `    String[] args = [\n` +
        `      'node',`,
      after:
        `  static private String[] convertOptionsToCommandArgs(String command, Map options) {\n` +
        `    def resolvedNodeExecutable = System.getProperty('node.binary') ?: System.getenv('NODE_BINARY') ?: 'node'\n` +
        `    String[] args = [\n` +
        `      resolvedNodeExecutable,`,
    },
  ]
);

patchFile(path.join(expoConstantsRoot, "scripts", "get-app-config-android.gradle"), [
  {
    before:
      `import org.apache.tools.ant.taskdefs.condition.Os\n\n` +
      `\n` +
      `def expoConstantsDir = project.providers.exec {`,
    after:
      `import org.apache.tools.ant.taskdefs.condition.Os\n\n` +
      `def nodeExecutable = System.getProperty('node.binary') ?: System.getenv('NODE_BINARY') ?: 'node'\n\n` +
      `def expoConstantsDir = project.providers.exec {`,
  },
  {
    before:
      `  commandLine("node", "-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));")`,
    after:
      `  commandLine(nodeExecutable, "-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));")`,
  },
  {
    before: `def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: ["node"]`,
    after: `def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: [nodeExecutable]`,
  },
]);

patchFile(path.join(expoModulesCoreRoot, "android", "build.gradle"), [
  {
    before:
      `group = 'host.exp.exponent'\n` +
      `version = '2.2.3'\n\n` +
      `def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")`,
    after:
      `group = 'host.exp.exponent'\n` +
      `version = '2.2.3'\n\n` +
      `def nodeExecutable = System.getProperty('node.binary') ?: System.getenv('NODE_BINARY') ?: 'node'\n\n` +
      `def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")`,
  },
  {
    before:
      `      commandLine("node", "--print", "require.resolve('react-native/package.json')")`,
    after:
      `      commandLine(nodeExecutable, "--print", "require.resolve('react-native/package.json')")`,
  },
]);

patchFile(
  path.join(expoModulesCoreRoot, "android", "ExpoModulesCorePlugin.gradle"),
  [
    {
      before:
        `      publications {\n` +
        `        release(MavenPublication) {\n` +
        `          from components.release\n` +
        `        }\n` +
        `      }`,
      after:
        `      publications {\n` +
        `        def releaseComponent = project.components.findByName("release")\n` +
        `        if (releaseComponent != null) {\n` +
        `          release(MavenPublication) {\n` +
        `            from releaseComponent\n` +
        `          }\n` +
        `        }\n` +
        `      }`,
    },
  ]
);

console.log("mobile android dependency patches applied");
