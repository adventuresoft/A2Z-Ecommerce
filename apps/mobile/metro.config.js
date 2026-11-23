const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages (e.g., packages/api-client) while isolating React/RN resolution
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Note: disableHierarchicalLookup must remain false in pnpm monorepos so transitive deps in .pnpm/ resolve
config.resolver.unstable_enablePackageExports = true;

// Ensure workspace packages (e.g. @repo/api-client) share the exact same singleton instances as apps/mobile
const SINGLETON_PACKAGES = ['react', 'react-native', '@tanstack/react-query'];
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETON_PACKAGES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`),
  );
  const nextContext = isSingleton
    ? { ...context, originModulePath: path.join(projectRoot, 'package.json') }
    : context;

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(nextContext, moduleName, platform);
  }
  return context.resolveRequest(nextContext, moduleName, platform);
};

module.exports = config;
