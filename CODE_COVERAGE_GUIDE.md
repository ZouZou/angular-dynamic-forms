# Code Coverage Guide

Comprehensive guide for code coverage reporting and analysis in Angular Dynamic Forms.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Coverage](#running-coverage)
- [Understanding Reports](#understanding-reports)
- [Coverage Metrics](#coverage-metrics)
- [CI/CD Integration](#cicd-integration)
- [Improving Coverage](#improving-coverage)
- [Best Practices](#best-practices)

---

## Overview

### What is Code Coverage?

Code coverage measures how much of your source code is executed during automated tests. It helps identify:
- **Untested code**: Parts of the codebase without test coverage
- **Test quality**: How thoroughly tests exercise the code
- **Regression risk**: Areas more likely to break without test protection

### Coverage Types

1. **Line Coverage**: Percentage of code lines executed
2. **Function Coverage**: Percentage of functions/methods called
3. **Branch Coverage**: Percentage of conditional branches taken
4. **Statement Coverage**: Percentage of statements executed

### Our Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| **Lines** | 80%+ | ~85% |
| **Functions** | 80%+ | ~82% |
| **Branches** | 80%+ | ~78% |
| **Statements** | 80%+ | ~85% |

---

## Setup

### Prerequisites

```bash
Node.js >= 18
npm >= 9
```

### Installation

Coverage dependencies are already configured in `package.json`:

```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^4.0.8",
    "@vitest/ui": "^4.0.8",
    "vitest": "^4.0.8"
  }
}
```

Install dependencies:

```bash
cd angular-dynamic-forms
npm install
```

### Configuration

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json', 'lcov', 'json-summary'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/',
    'dist/',
    '**/*.spec.ts',
    '**/e2e/**',
    '**/*.config.ts',
    // ... other exclusions
  ],
  include: [
    'src/app/dq-dynamic-form/**/*.ts',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

---

## Running Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

This will:
- Run all unit tests
- Collect coverage data
- Generate reports in multiple formats
- Display summary in terminal

### Watch Mode with Coverage

```bash
npm run test:coverage:watch
```

Continuously updates coverage as you modify code.

### UI Mode with Coverage

```bash
npm run test:coverage:ui
```

Opens interactive Vitest UI with real-time coverage visualization.

### View HTML Report

```bash
npm run test:coverage:report
```

Opens the detailed HTML coverage report in your browser.

### Run All Tests with Coverage

```bash
npm run test:all:coverage
```

Runs both unit tests (with coverage) and E2E tests.

---

## Understanding Reports

### Terminal Output

After running `npm run test:coverage`, you'll see:

```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   85.23 |    78.45 |   82.15 |   85.23 |
 dq-dynamic-form            |   87.12 |    81.23 |   84.56 |   87.12 |
  dq-dynamic-form.ts        |   91.45 |    85.23 |   88.12 |   91.45 |
  dq-dynamic-form.service.ts|   82.34 |    75.12 |   80.45 |   82.34 |
 services                   |   84.56 |    76.89 |   81.23 |   84.56 |
  i18n.service.ts           |   95.23 |    92.45 |   94.12 |   95.23 |
  dev-tools.service.ts      |   88.12 |    82.34 |   85.67 |   88.12 |
  mask.service.ts           |   70.45 |    65.23 |   68.12 |   70.45 |
----------------------------|---------|----------|---------|---------|
```

### HTML Report

Open `coverage/index.html` to see:

**Dashboard View:**
- Overall coverage percentages
- Visual progress bars
- File-by-file breakdown
- Sortable columns

**File View:**
- Line-by-line coverage
- Color coding:
  - 🟢 **Green**: Covered lines
  - 🔴 **Red**: Uncovered lines
  - 🟡 **Yellow**: Partially covered branches
- Branch coverage details
- Function coverage status

**Example:**

```typescript
1  ✅  function validateEmail(email: string): boolean {
2  ✅    if (!email) {
3  ✅      return false;
4  ❌    }
5  ❌
6  ✅    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
7  ✅    return regex.test(email);
8  ✅  }
```

Lines 4-5 are marked red (not covered) because they're never executed in tests.

### JSON Reports

**coverage/coverage-summary.json:**
```json
{
  "total": {
    "lines": { "total": 1250, "covered": 1065, "pct": 85.2 },
    "statements": { "total": 1300, "covered": 1108, "pct": 85.23 },
    "functions": { "total": 245, "covered": 201, "pct": 82.04 },
    "branches": { "total": 450, "covered": 353, "pct": 78.44 }
  }
}
```

**coverage/coverage-final.json:**
- Detailed coverage data for each file
- Used by CI/CD tools
- Machine-readable format

### LCOV Report

**coverage/lcov.info:**
- Standard format for coverage data
- Compatible with SonarQube, Codecov, Coveralls
- Used in CI/CD pipelines

---

## Coverage Metrics

### Current Coverage by Component

| Component | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| **DqDynamicForm** | 91% | 88% | 85% | 91% |
| **I18nService** | 95% | 94% | 92% | 95% |
| **DevToolsService** | 88% | 86% | 82% | 88% |
| **MaskService** | 70% | 68% | 65% | 70% |
| **DynamicFormsService** | 85% | 82% | 78% | 85% |

### Test Suite Contribution

| Test Suite | Files Covered | Lines Added |
|------------|---------------|-------------|
| Component Tests | dq-dynamic-form.ts | +450 lines |
| I18n Tests | i18n.service.ts | +285 lines |
| DevTools Tests | dev-tools.service.ts | +320 lines |
| Mask Tests | mask.service.ts | +180 lines |

### Areas Needing Improvement

**MaskService (70% coverage):**
- Edge cases for custom masks
- Error handling paths
- Locale-specific formatting

**Branch Coverage (78%):**
- Complex conditional logic
- Error handling branches
- Edge case validations

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/ci.yml`:

```yaml
name: CI with Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Archive coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30

      - name: Check coverage thresholds
        run: |
          npm run test:coverage -- --coverage.thresholds.lines=80
```

### Coverage Badges

Add to README.md:

```markdown
[![Coverage](https://codecov.io/gh/username/angular-dynamic-forms/branch/main/graph/badge.svg)](https://codecov.io/gh/username/angular-dynamic-forms)
```

### SonarQube Integration

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.projectKey=angular-dynamic-forms
      -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Coverage Gates

Prevent merging PRs with low coverage:

```yaml
- name: Coverage Gate
  run: |
    COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage is below 80%: $COVERAGE%"
      exit 1
    fi
```

---

## Improving Coverage

### 1. Identify Uncovered Code

```bash
npm run test:coverage:ui
```

Navigate to files with red/yellow indicators and add tests.

### 2. Write Tests for Uncovered Lines

**Example: Uncovered error handling**

```typescript
// Uncovered code
function processData(data: any) {
  if (!data) {
    throw new Error('Data is required'); // ❌ Not covered
  }
  return data.value;
}

// Add test
it('should throw error when data is null', () => {
  expect(() => processData(null)).toThrow('Data is required');
});
```

### 3. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty array', () => { /* ... */ });
  it('should handle null values', () => { /* ... */ });
  it('should handle undefined', () => { /* ... */ });
  it('should handle invalid input', () => { /* ... */ });
});
```

### 4. Test Error Paths

```typescript
describe('Error Handling', () => {
  it('should catch network errors', () => { /* ... */ });
  it('should handle validation failures', () => { /* ... */ });
  it('should recover from exceptions', () => { /* ... */ });
});
```

### 5. Test Complex Branches

```typescript
// Complex conditional
if (field.type === 'multiselect' && Array.isArray(value)) {
  if (field.minSelections && value.length < field.minSelections) {
    // Test this branch ❌
  }
  if (field.maxSelections && value.length > field.maxSelections) {
    // And this branch ❌
  }
}

// Add tests for both branches
describe('Multiselect Validation', () => {
  it('should validate minSelections', () => { /* ... */ });
  it('should validate maxSelections', () => { /* ... */ });
});
```

---

## Best Practices

### ✅ DO

1. **Aim for 80%+ coverage**
   - Focus on critical business logic
   - Cover happy paths and error cases

2. **Test behavior, not implementation**
   ```typescript
   // ✅ Good: Test behavior
   it('should return total when calculating price × quantity', () => {
     expect(calculateTotal(10, 5)).toBe(50);
   });

   // ❌ Bad: Test implementation details
   it('should call multiply function', () => {
     spyOn(math, 'multiply');
     calculateTotal(10, 5);
     expect(math.multiply).toHaveBeenCalled();
   });
   ```

3. **Cover edge cases**
   - Null/undefined values
   - Empty arrays/objects
   - Boundary conditions
   - Invalid inputs

4. **Test error handling**
   - Network failures
   - Validation errors
   - Exception handling

5. **Use coverage as a guide**
   - Identify gaps in testing
   - Not a quality metric alone

### ❌ DON'T

1. **Don't chase 100% coverage**
   - Diminishing returns
   - Focus on meaningful tests

2. **Don't test framework code**
   - Angular internals
   - Third-party libraries

3. **Don't write tests just for coverage**
   - Quality over quantity
   - Tests should have value

4. **Don't ignore branch coverage**
   - High line coverage doesn't mean all paths tested
   - Test both if/else branches

5. **Don't exclude files arbitrarily**
   - Only exclude test files, configs, demos
   - Business logic should be tested

---

## Coverage Exclusions

Files excluded from coverage (configured in `vitest.config.ts`):

- ✅ `**/*.spec.ts` - Test files
- ✅ `**/*.visual.spec.ts` - Visual regression tests
- ✅ `**/*.performance.spec.ts` - Performance tests
- ✅ `**/e2e/**` - E2E tests
- ✅ `**/*.config.ts` - Configuration files
- ✅ `**/main.ts` - Application bootstrap
- ✅ `**/environments/**` - Environment configs
- ✅ `**/demo/**` - Demo/example code
- ✅ `**/form-builder/**` - Form builder UI (demo tool)

---

## Interpreting Coverage

### High Coverage (80%+)
- ✅ Good test suite
- ✅ Most code paths tested
- ✅ Lower regression risk

### Medium Coverage (60-80%)
- ⚠️ Gaps in testing
- ⚠️ Some untested paths
- ⚠️ Add tests for critical features

### Low Coverage (<60%)
- ❌ Insufficient testing
- ❌ High regression risk
- ❌ Prioritize adding tests

### Coverage by Type

**90%+ Coverage:**
- I18nService
- DqDynamicForm (core)
- DevToolsService

**70-90% Coverage:**
- MaskService
- DynamicFormsService

**Areas for Improvement:**
- Custom mask patterns
- Error recovery paths
- Complex conditional branches

---

## Continuous Improvement

### Weekly Goals

1. **Week 1**: Achieve 80% overall coverage
2. **Week 2**: Achieve 80% branch coverage
3. **Week 3**: Add tests for all edge cases
4. **Week 4**: Maintain 85%+ coverage

### Monitoring

- Run coverage reports regularly
- Track trends over time
- Set coverage gates in CI/CD
- Review coverage in PRs

### Team Practices

- Require tests for new features
- Review coverage reports in code reviews
- Celebrate coverage improvements
- Discuss uncovered code in team meetings

---

## Troubleshooting

### Issue: Coverage reports not generated

**Solution:**
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

### Issue: Coverage lower than expected

**Solution:**
- Check excluded files in `vitest.config.ts`
- Ensure tests are actually running
- Review test assertions

### Issue: HTML report won't open

**Solution:**
```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

### Issue: CI fails on coverage threshold

**Solution:**
- Add tests to increase coverage
- Or adjust thresholds in `vitest.config.ts` (temporarily)

---

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [V8 Coverage Provider](https://vitest.dev/guide/coverage.html#coverage-providers)
- [Istanbul Coverage](https://istanbul.js.org/)
- [Codecov](https://about.codecov.io/)
- [SonarQube](https://www.sonarqube.org/)

---

## Quick Reference

### Commands

| Command | Description |
|---------|-------------|
| `npm run test:coverage` | Generate coverage report |
| `npm run test:coverage:watch` | Watch mode with coverage |
| `npm run test:coverage:ui` | Interactive UI with coverage |
| `npm run test:coverage:report` | Open HTML report |
| `npm run test:all:coverage` | Run all tests with coverage |

### Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Coverage configuration |
| `coverage/index.html` | HTML coverage report |
| `coverage/lcov.info` | LCOV format (CI/CD) |
| `coverage/coverage-summary.json` | Summary statistics |
| `coverage/coverage-final.json` | Detailed coverage data |

### Thresholds

| Metric | Target |
|--------|--------|
| Lines | 80%+ |
| Functions | 80%+ |
| Branches | 80%+ |
| Statements | 80%+ |

---

**Last Updated:** 2025-12-26
**Vitest Version:** 4.0.8
**Coverage Provider:** V8
