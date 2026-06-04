# Testing Conventions

This document outlines testing conventions for the voronoi-map-mcp-server project. All contributors should follow these patterns when writing or modifying tests.

## Test Stack

- **[Tape](https://github.com/substack/tape)** — test runner and assertions
- **[Sinon.js](https://sinonjs.org/)** — spies and stubs for parameter verification

Test files live in the `test/` directory: `test/compute.test.js` and `test/server.test.js`.

## Scope: For now, Unit Tests Only

This project currently focuses on **unit testing**. Integration tests are not part of the current strategy, but this may evolve as the project grows or deployment patterns change.

**Rationale:** The MCP server is a thin wrapper around the stable, battle-tested d3-voronoi-map library. Unit tests provide sufficient regression protection for the wrapper layer. If the project grows in complexity or integration concerns arise, integration testing can be revisited.

**If integration tests are ever added:** They would live in `test/integration.test.js` and follow the patterns defined at the end of this document.

## Unit Tests: Code Responsibility

Unit tests focus exclusively on your code's behavior, not on the behavior of functions it calls.

**Core principle:** Only test the behavior of the function under test. Any function your code calls—whether from a library or another part of your codebase—should be assumed to work correctly and should not be tested.

**Why:** Focuses on the responsibility of your function; avoids redundant testing of dependencies; tests remain valid when dependencies change or internal functions are refactored.

**Good examples:**
- Test that you called .clip() with correct parameters ✅ (your responsibility: passing correct args)
- Test that you extracted and formatted data correctly ✅ (your responsibility: extraction logic)
- Test that you correctly parsed the API response and mapped it to your data structure ✅ (your responsibility: parsing/mapping)

**Bad examples:**
- Test that .clip() computed correct coordinates ❌ (d3's responsibility)
- Test that extracted data is mathematically correct ❌ (source's responsibility)
- Test that the JSON library correctly parses JSON ❌ (library's responsibility)

**The key question:** Before writing any test, ask: "Who is responsible for this behavior — my code, or a dependency?" If the answer is a dependency, don't test it.

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should match original input for id and weight"
- ✅ "should call .clip() with convex hull when shape provided"
- ❌ "id and weight match original input"
- ❌ "clip is called with convex hull"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

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
- ✅ "should throw error for fully collinear shape" (error case)
- ✅ "should not throw error if some vertices are collinear but shape still defines valid area" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what shapes ARE allowed.

## Running Tests

```bash
yarn test
```
