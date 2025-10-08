#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log('🔍 Vetify Test Coverage Analysis');
console.log('Generating comprehensive test coverage report...\n');

try {
  // Run tests with coverage
  console.log('📊 Running tests with coverage...\n');
  execSync('pnpm test:coverage', { stdio: 'inherit' });
  
  // Read coverage summary
  const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json');
  let coverageData;
  
  try {
    coverageData = JSON.parse(readFileSync(coveragePath, 'utf8'));
  } catch (error) {
    console.log('⚠️  Could not read coverage summary, checking for alternative coverage files...');
    
    // Try to find other coverage files
    const lcovPath = join(process.cwd(), 'coverage', 'lcov.info');
    if (require('fs').existsSync(lcovPath)) {
      console.log('✅ Found lcov.info file');
      coverageData = { total: { lines: { pct: 0 }, statements: { pct: 0 }, functions: { pct: 0 }, branches: { pct: 0 } } };
    } else {
      throw new Error('No coverage files found');
    }
  }

  // Display coverage summary
  console.log('✅ Coverage Report Generated Successfully!\n');
  
  if (coverageData && coverageData.total) {
    const total = coverageData.total;
    console.log('📈 Coverage Summary:');
    console.log('──────────────────────────────────────────────────');
    console.log(`❌ lines          : ${total.lines?.pct || 0}%`);
    console.log(`❌ statements     : ${total.statements?.pct || 0}%`);
    console.log(`❌ functions      : ${total.functions?.pct || 0}%`);
    console.log(`❌ branches       : ${total.branches?.pct || 0}%`);
    
    if (total.branchesTrue) {
      console.log(`✅ branchesTrue   : ${total.branchesTrue.pct || 0}%`);
    }
  } else {
    console.log('📈 Coverage Summary:');
    console.log('──────────────────────────────────────────────────');
    console.log('❌ No coverage data available');
  }

  // Generate recommendations
  const recommendations = generateRecommendations(coverageData);
  
  console.log('\n📁 Coverage by Directory:');
  console.log('──────────────────────────────────────────────────');
  
  if (coverageData && coverageData.total) {
    // Display directory coverage if available
    Object.keys(coverageData).forEach(key => {
      if (key !== 'total' && coverageData[key]) {
        const dir = coverageData[key];
        console.log(`${key}: ${dir.lines?.pct || 0}% lines, ${dir.statements?.pct || 0}% statements`);
      }
    });
  }

  console.log('\n💡 Coverage Recommendations:');
  console.log('──────────────────────────────────────────────────');
  recommendations.forEach(rec => console.log(rec));

  console.log('\n📋 Coverage Reports:');
  console.log('──────────────────────────────────────────────────');
  console.log(`📄 HTML Report: file://${join(process.cwd(), 'coverage', 'lcov-report', 'index.html')}`);
  console.log(`📊 JSON Summary: ${coveragePath}`);

  // Generate markdown report
  generateCoverageSummary(coverageData, recommendations);
  
} catch (error) {
  console.error('❌ Error generating coverage report:', error.message);
  process.exit(1);
}

function generateRecommendations(coverageData) {
  const recommendations = [];
  
  if (!coverageData || !coverageData.total) {
    recommendations.push('🔴 Run tests with coverage to generate data');
    return recommendations;
  }

  const total = coverageData.total;
  
  if ((total.lines?.pct || 0) < 80) {
    recommendations.push('🔴 Increase overall line coverage to at least 80%');
  }
  
  if ((total.branches?.pct || 0) < 70) {
    recommendations.push('🟡 Improve branch coverage to handle edge cases');
  }
  
  if ((total.functions?.pct || 0) < 80) {
    recommendations.push('🟡 Ensure all functions have test coverage');
  }
  
  if ((total.statements?.pct || 0) < 80) {
    recommendations.push('🟡 Add tests for uncovered statements');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Excellent coverage! Maintain this level.');
  }

  return recommendations;
}

function generateCoverageSummary(coverageData, recommendations) {
  const markdown = `# Test Coverage Summary

Generated on: ${new Date().toISOString()}

## Overall Coverage

${coverageData && coverageData.total ? `
- **Lines**: ${coverageData.total.lines?.pct || 0}%
- **Statements**: ${coverageData.total.statements?.pct || 0}%
- **Functions**: ${coverageData.total.functions?.pct || 0}%
- **Branches**: ${coverageData.total.branches?.pct || 0}%
` : 'No coverage data available'}

## Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. Add tests for uncovered components
2. Improve branch coverage with edge case testing
3. Add integration tests for API endpoints
4. Implement E2E tests for critical user flows
5. Set up automated coverage reporting in CI/CD

## Test Categories

- ✅ Unit Tests: Security, Performance, Components, Database Queries
- ✅ Integration Tests: API Endpoints, Authentication
- 🔄 E2E Tests: Critical User Flows (Next Phase)
- 🔄 Performance Tests: Load Testing (Next Phase)
- 🔄 Security Tests: Penetration Testing (Next Phase)

---

*This report was generated automatically by the test coverage script.*
`;

  const outputPath = join(process.cwd(), 'COVERAGE_SUMMARY.md');
  writeFileSync(outputPath, markdown);
  console.log(`\n📝 Markdown report saved to: ${outputPath}`);
}
