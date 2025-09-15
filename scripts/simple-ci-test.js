#!/usr/bin/env node

/**
 * Simple CI Test Script
 * Basic tests that work reliably in GitHub Actions environment
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running simple CI tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test 1: Check required files exist
test('Required files exist', () => {
  const requiredFiles = ['index.html', 'main.js', 'sw.js', 'package.json', 'README.md'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
});

// Test 2: Check required directories exist
test('Required directories exist', () => {
  const requiredDirs = ['game', 'data'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`Missing required directory: ${dir}`);
    }
  }
});

// Test 3: Check game files exist
test('Game files exist', () => {
  const gameFiles = [
    'game/content-loader.js',
    'game/game-state.js',
    'game/runner-engine.js',
    'game/question-presenter.js'
  ];
  for (const file of gameFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing game file: ${file}`);
    }
  }
});

// Test 4: Check question data files exist
test('Question data files exist', () => {
  const dataFiles = fs.readdirSync('data').filter(f => f.endsWith('.json'));
  if (dataFiles.length === 0) {
    throw new Error('No question data files found');
  }
  if (dataFiles.length < 3) {
    throw new Error(`Expected at least 3 question sets, found ${dataFiles.length}`);
  }
});

// Test 5: Validate JSON syntax in question files
test('Question files have valid JSON', () => {
  const dataFiles = fs.readdirSync('data').filter(f => f.endsWith('.json'));
  for (const file of dataFiles) {
    try {
      const content = fs.readFileSync(path.join('data', file), 'utf8');
      JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in ${file}: ${error.message}`);
    }
  }
});

// Test 6: Check package.json is valid
test('Package.json is valid', () => {
  const content = fs.readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(content);
  if (!pkg.name || !pkg.version) {
    throw new Error('Package.json missing name or version');
  }
});

// Test 7: Check index.html contains required elements
test('Index.html has required content', () => {
  const content = fs.readFileSync('index.html', 'utf8');
  if (!content.includes('kaboom')) {
    throw new Error('Index.html missing Kaboom.js reference');
  }
  if (!content.includes('main.js')) {
    throw new Error('Index.html missing main.js reference');
  }
});

// Test 8: Check main.js exists and has content
test('Main.js has content', () => {
  const content = fs.readFileSync('main.js', 'utf8');
  if (content.length < 100) {
    throw new Error('Main.js appears to be empty or too small');
  }
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('📊 Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📝 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Ready for deployment.');
  process.exit(0);
} else {
  console.log(`\n💥 ${failed} test(s) failed. Please fix before deploying.`);
  process.exit(1);
}