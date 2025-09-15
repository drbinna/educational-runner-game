#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Checks that all required files and directories exist for successful deployment
 */

const fs = require('fs');
const path = require('path');

// Required files for deployment
const REQUIRED_FILES = [
  'index.html',
  'main.js',
  'sw.js',
  'README.md',
  'package.json'
];

// Required directories for deployment
const REQUIRED_DIRECTORIES = [
  'game',
  'data'
];

// Optional but recommended files
const RECOMMENDED_FILES = [
  'LICENSE',
  'netlify.toml',
  'vercel.json',
  '.htaccess',
  '404.html',
  '500.html',
  'offline.html'
];

/**
 * Check if a file exists
 */
function checkFile(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists
 */
function checkDirectory(dirpath) {
  try {
    const stats = fs.statSync(dirpath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Main validation function
 */
function validateDeployment() {
  console.log('🔍 Validating deployment readiness...\n');
  
  let errors = 0;
  let warnings = 0;
  
  // Check required files
  console.log('📄 Checking required files:');
  for (const file of REQUIRED_FILES) {
    if (checkFile(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING (REQUIRED)`);
      errors++;
    }
  }
  
  // Check required directories
  console.log('\n📁 Checking required directories:');
  for (const dir of REQUIRED_DIRECTORIES) {
    if (checkDirectory(dir)) {
      // Count files in directory
      try {
        const files = fs.readdirSync(dir);
        console.log(`  ✅ ${dir}/ (${files.length} files)`);
      } catch (error) {
        console.log(`  ✅ ${dir}/ (unable to count files)`);
      }
    } else {
      console.log(`  ❌ ${dir}/ - MISSING (REQUIRED)`);
      errors++;
    }
  }
  
  // Check recommended files
  console.log('\n📋 Checking recommended files:');
  for (const file of RECOMMENDED_FILES) {
    if (checkFile(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} - Missing (recommended)`);
      warnings++;
    }
  }
  
  // Check specific game files
  console.log('\n🎮 Checking game files:');
  const gameFiles = [
    'game/content-loader.js',
    'game/game-state.js',
    'game/runner-engine.js',
    'game/question-presenter.js',
    'game/question-flow-manager.js',
    'game/subject-config.js',
    'game/question-type-handler.js'
  ];
  
  for (const file of gameFiles) {
    if (checkFile(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      errors++;
    }
  }
  
  // Check question data files
  console.log('\n📚 Checking question data files:');
  try {
    const dataFiles = fs.readdirSync('data').filter(f => f.endsWith('.json'));
    if (dataFiles.length > 0) {
      console.log(`  ✅ Found ${dataFiles.length} question sets:`);
      for (const file of dataFiles) {
        console.log(`    • ${file}`);
      }
    } else {
      console.log(`  ❌ No JSON question files found in data/`);
      errors++;
    }
  } catch (error) {
    console.log(`  ❌ Cannot read data directory`);
    errors++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  
  if (errors === 0) {
    console.log('🎉 All required files present - Ready for deployment!');
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} recommended files missing (deployment will still work)`);
    }
    process.exit(0);
  } else {
    console.log(`❌ ${errors} critical files missing - Deployment will fail`);
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} recommended files missing`);
    }
    console.log('\nPlease ensure all required files are present before deploying.');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateDeployment();
}

module.exports = { validateDeployment, checkFile, checkDirectory };