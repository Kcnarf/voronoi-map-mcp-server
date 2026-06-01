# Testing Conventions

This document outlines testing conventions for the voronoi-map-mcp-server project. All contributors should follow these patterns when writing or modifying tests.

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should match original input for id and weight"
- ✅ "should call .clip() with convex hull when shape provided"
- ❌ "id and weight match original input"
- ❌ "clip is called with convex hull"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

## Test Code Responsibility

Test your code's behavior, not your dependencies' behavior. A test should verify the responsibility of the code under test, not the responsibilities of the libraries it uses.

**The Principle:**
- ✅ Test that **your code** correctly handles errors, formats responses, or passes parameters
- ❌ Don't test that **your dependencies** (Zod, d3-voronoi-map, etc.) validate input or enforce constraints

**Why:** 
- **Framework independence** — If you swap Zod for another validation library, tests should still pass as long as error handling is correct
- **Avoid duplicate testing** — Libraries are already tested by their maintainers; testing their behavior is redundant
- **Focus on what you control** — Your code's responsibility is error formatting, response structure, and control flow—not validation rules
- **Resilience to change** — Tests survive refactoring when they verify behavior, not implementation details

**Examples:**

❌ **Don't test dependency behavior (Zod's job):**
```javascript
t.test('should reject negative weight', async (t) => {
  const result = await handleComputeVoronoiMap({
    data: [{ id: 'a', weight: -5 }]
  });
  t.equal(result.isError, true);
  // This tests Zod's validation rule, not your code's responsibility
});
```

✅ **Do test your code's behavior (error handling):**
```javascript
t.test('should format validation errors with "Validation error:" prefix', async (t) => {
  const result = await handleComputeVoronoiMap({ data: [] }); // any invalid input
  t.equal(result.isError, true);
  t.ok(result.content[0].text.startsWith('Validation error:'));
  // This tests your code's responsibility: formatting validation errors correctly
});
```

**How to identify violations:**
- Does the test verify a library's validation rule (minValue, required, array length)?
- Does the test verify behavior that would remain identical if you swapped the library?
- If replacing the dependency **would** invalidate the test, the test is probably testing the dependency, not your code

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

**Setup:**
1. Accept optional `_simulationFactory` parameter in `compute.js` (defaults to real `voronoiMapSimulation`)
2. In tests, create mock simulation with helper function:
```javascript
function createMockSimulation() {
  return {
    clip: sinon.stub().returnsThis(),
    maxIterationCount: sinon.stub().returnsThis(),
    // ... other methods
  };
}
```

**Usage in tests:**
```javascript
const mockSimulation = createMockSimulation();
const factory = sinon.stub().returns(mockSimulation);
computeVoronoiMap({ data, shape: [...], seed: 'test' }, factory);

// Assert the method was called with correct value
t.ok(mockSimulation.clip.calledOnce, '.clip() called once');
t.ok(mockSimulation.maxIterationCount.calledOnceWithExactly(5), 'called with value 5');
```

**Why:** Tests the implementation contract explicitly; catches parameter mismatches without relying on behavior inference; enables verification that methods are NOT called when parameters are omitted.

## Edge Case Testing

For error conditions, test both the failure case AND the success boundary case.

**Example - Collinear vertices:**
- ✅ "should throw degenerate polygon error for collinear 0-area shape" (error case)
- ✅ "should not throw error if some vertices are collinear but shape still defines valid area" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what shapes ARE allowed.

## Running Tests

```bash
yarn test          # Run all tests
```

Tests use [Tape](https://github.com/substack/tape) for assertions and [Sinon.js](https://sinonjs.org/) for spies/stubs.

## Test Organization Summary

Current test groups in `test/compute.test.js`:

1. **Datum extraction** — Verify data preservation through simulation
2. **Seed determinism** — Verify reproducibility with seeds
3. **Parameter tests** — One group per parameter (shape, seed, maxIterationCount, minWeightRatio, convergenceRatio)
4. **Hull error handling** — Validate polygon degeneration detection
5. **Integration tests** — MCP responses, validation, error formatting
