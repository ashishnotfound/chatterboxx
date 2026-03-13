#!/usr/bin/env node

// Production build verification script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Production Build Checks...\n');

// Check TypeScript compilation
try {
  console.log('1️⃣ Checking TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation passed\n');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Check ESLint
try {
  console.log('2️⃣ Running ESLint...');
  execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'inherit' });
  console.log('✅ ESLint passed\n');
} catch (error) {
  console.error('❌ ESLint failed');
  process.exit(1);
}

// Build the project
try {
  console.log('3️⃣ Building for production...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful\n');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Check build output
const distPath = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Build output directory not found');
  process.exit(1);
}

const stats = fs.statSync(distPath);
console.log(`📦 Build size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

// Check for critical files
const criticalFiles = [
  'dist/index.html',
  'dist/assets/index.js',
  'dist/assets/style.css'
];

for (const file of criticalFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ Critical file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ All critical files present\n');

console.log('🎉 Production build checks completed successfully!');
console.log('\n📋 Ready for deployment:');
console.log('   - TypeScript compiled without errors');
console.log('   - ESLint passed with zero warnings');
console.log('   - Production build completed');
console.log('   - All critical files present');
