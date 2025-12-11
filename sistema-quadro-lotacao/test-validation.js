#!/usr/bin/env node

/**
 * Test Validation Script
 * Validates the test suite structure and reports on test coverage
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Sistema Quadro Lotação - Test Validation Report');
console.log('=' .repeat(60));

// Find all test files
function findTestFiles(dir, testFiles = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      findTestFiles(filePath, testFiles);
    } else if (file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      testFiles.push(filePath);
    }
  }
  
  return testFiles;
}

// Analyze test file content
function analyzeTestFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const describes = (content.match(/describe\(/g) || []).length;
    const tests = (content.match(/it\(|test\(/g) || []).length;
    const propertyTests = content.includes('fc.assert') || content.includes('fast-check');
    const hasImportIssues = content.includes("Cannot find module") || 
                           content.includes("import type") && content.includes("new Pool");
    
    return {
      describes,
      tests,
      propertyTests,
      hasImportIssues,
      lines: content.split('\n').length
    };
  } catch (error) {
    return {
      describes: 0,
      tests: 0,
      propertyTests: false,
      hasImportIssues: true,
      lines: 0,
      error: error.message
    };
  }
}

// Main validation
const srcDir = path.join(__dirname, 'src');
const testFiles = findTestFiles(srcDir);

console.log(`📁 Found ${testFiles.length} test files\n`);

let totalDescribes = 0;
let totalTests = 0;
let propertyTestFiles = 0;
let filesWithIssues = 0;

const categories = {
  services: [],
  components: [],
  controllers: [],
  modules: [],
  core: [],
  other: []
};

testFiles.forEach(filePath => {
  const relativePath = path.relative(srcDir, filePath);
  const analysis = analyzeTestFile(filePath);
  
  totalDescribes += analysis.describes;
  totalTests += analysis.tests;
  
  if (analysis.propertyTests) propertyTestFiles++;
  if (analysis.hasImportIssues || analysis.error) filesWithIssues++;
  
  // Categorize
  let category = 'other';
  if (relativePath.includes('services/')) category = 'services';
  else if (relativePath.includes('components/')) category = 'components';
  else if (relativePath.includes('controllers/')) category = 'controllers';
  else if (relativePath.includes('modules/')) category = 'modules';
  else if (relativePath.includes('core/')) category = 'core';
  
  categories[category].push({
    path: relativePath,
    ...analysis
  });
});

// Report by category
Object.entries(categories).forEach(([category, files]) => {
  if (files.length === 0) return;
  
  console.log(`📂 ${category.toUpperCase()} (${files.length} files)`);
  files.forEach(file => {
    const status = file.error ? '❌' : 
                  file.hasImportIssues ? '⚠️' : 
                  file.propertyTests ? '🔬' : '✅';
    
    console.log(`  ${status} ${file.path} (${file.describes} describes, ${file.tests} tests)`);
    if (file.error) {
      console.log(`      Error: ${file.error}`);
    }
  });
  console.log();
});

// Summary
console.log('📊 SUMMARY');
console.log('-'.repeat(40));
console.log(`Total Test Files: ${testFiles.length}`);
console.log(`Total Test Suites: ${totalDescribes}`);
console.log(`Total Test Cases: ${totalTests}`);
console.log(`Property-Based Test Files: ${propertyTestFiles}`);
console.log(`Files with Issues: ${filesWithIssues}`);

// Test coverage by area
console.log('\n🎯 COVERAGE BY AREA');
console.log('-'.repeat(40));
console.log(`Services: ${categories.services.length} files`);
console.log(`Components: ${categories.components.length} files`);
console.log(`Controllers: ${categories.controllers.length} files`);
console.log(`Modules: ${categories.modules.length} files`);
console.log(`Core: ${categories.core.length} files`);

// Recommendations
console.log('\n💡 RECOMMENDATIONS');
console.log('-'.repeat(40));

if (filesWithIssues > 0) {
  console.log(`⚠️  Fix ${filesWithIssues} files with import/compilation issues`);
}

if (propertyTestFiles > 0) {
  console.log(`🔬 ${propertyTestFiles} property-based test files found - excellent!`);
}

const coverageScore = Math.round((testFiles.length / 50) * 100); // Assuming ~50 source files
console.log(`📈 Estimated test coverage: ${Math.min(coverageScore, 100)}%`);

console.log('\n✨ Test suite analysis complete!');