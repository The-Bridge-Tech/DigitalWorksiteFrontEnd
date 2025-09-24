#!/usr/bin/env node
/**
 * Frontend Requirements Installer
 * Installs all required dependencies to fix TypeScript and build issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Frontend Requirements...\n');

// Read requirements
const requirements = JSON.parse(fs.readFileSync('package-requirements.json', 'utf8'));

// Check Node version
const nodeVersion = process.version.slice(1).split('.')[0];
const requiredNode = requirements.engines.node.replace('>=', '');
if (parseInt(nodeVersion) < parseInt(requiredNode)) {
  console.error(`❌ Node.js ${requiredNode}+ required, found ${process.version}`);
  process.exit(1);
}

console.log(`✅ Node.js ${process.version} OK`);

try {
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  const rootDeps = Object.entries(requirements.dependencies)
    .map(([pkg, version]) => `${pkg}@${version}`)
    .join(' ');
  
  execSync(`yarn add -W ${rootDeps}`, { stdio: 'inherit' });

  // Install dev dependencies
  console.log('🔧 Installing dev dependencies...');
  const devDeps = Object.entries(requirements.devDependencies)
    .map(([pkg, version]) => `${pkg}@${version}`)
    .join(' ');
  
  execSync(`yarn add -D -W ${devDeps}`, { stdio: 'inherit' });

  // Fix reporting-center package specifically
  console.log('📊 Fixing reporting-center package...');
  process.chdir('packages/reporting-center');
  execSync('yarn add react@^18.3.0 react-dom@^18.3.0', { stdio: 'inherit' });
  process.chdir('../..');

  // Build all packages
  console.log('🔨 Building packages...');
  execSync('yarn build', { stdio: 'inherit' });

  console.log('\n✅ All requirements installed successfully!');
  console.log('Run "yarn start" to begin development.');

} catch (error) {
  console.error('\n❌ Installation failed:', error.message);
  process.exit(1);
}