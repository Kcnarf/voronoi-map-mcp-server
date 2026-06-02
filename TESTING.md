# Testing Conventions

This document outlines testing conventions for the voronoi-map-mcp-server project. All contributors should follow these patterns when writing or modifying tests.

## Test Stack

- **[Tape](https://github.com/substack/tape)** — test runner and assertions
- **[Sinon.js](https://sinonjs.org/)** — spies and stubs for parameter verification

Test files live in the `test/` directory: `test/compute.test.js` and `test/server.test.js`.

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should match original input for id and weight"
- ✅ "should call .clip() with convex hull when shape provided"
- ❌ "id and weight match original input"
- ❌ "clip is called with convex hull"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

## Test Code Responsibility

Only test the behavior of the function under test, not the behavior of functions it calls. Any function your code calls—whether from a library or another part of your codebase—should be assumed to work correctly and should not be tested.

**Why:** Focuses on the responsibility of your function; avoids redundant testing of dependencies; tests remain valid when dependencies change or internal functions are refactored.

**Example:**

❌ Tests that Zod validates input (Zod's responsibility):
```javascript
t.test('should reject negative weight', async (t) => {
  const result = await handleComputeVoronoiMap({
    data: [{ id: 'a', weight: -5 }]
  });
  t.equal(result.isError, true); // Tests Zod, not your function
});
```

✅ Tests that your function formats validation errors correctly (your responsibility):
```javascript
t.test('should format validation errors with "Validation error:" prefix', async (t) => {
  const result = await handleComputeVoronoiMap({ data: [] });
  t.ok(result.content[0].text.startsWith('Validation error:'));
});
```

**How to identify violations:** If you're verifying behavior of a function your code calls, you're testing the dependency, not your code.

## Test Organization Structure

Group tests by function or parameter, not by outcome (error vs. success). Each parameter gets its own test group containing both the "provided" and "omitted" cases.

**Structure:**
```javascript
test('parameter-name', (t) => {
  t.test('should call method with correct value when provided', (t) => { ... });
  t.test('should not call method when parameter omitted', (t) => { ... });
});
```

**Why:** Makes it easy to understand all aspects of a single parameter; improves test discoverability; consistent with d3-voronoi-map library testing patterns.

**Example groups in this project:**
- `test('shape parameter', ...)`
- `test('seed parameter', ...)`
- `test('maxIterationCount parameter', ...)`

## Parameter Passing Verification (with Sinon.js)

Use Sinon stubs to directly verify that d3-voronoi-map methods are called with correct parameters. Do not infer parameter passing from output behavior.

**Why:** Tests the implementation contract explicitly; catches parameter mismatches without relying on behavior inference; enables verification that methods are NOT called when parameters are omitted.

## Edge Case Testing

For error conditions, test both the failure case AND the success boundary case.

**Example - Collinear vertices:**
- ✅ "should throw degenerate polygon error for collinear 0-area shape" (error case)
- ✅ "should not throw error if some vertices are collinear but shape still defines valid area" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what shapes ARE allowed.

## Running Tests

```bash
yarn test
```
