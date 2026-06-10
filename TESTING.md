# Testing Conventions

This document outlines testing conventions. All contributors should follow these patterns when writing or modifying tests.

The documents starts with generic rules and guidelines, then provides project-specific ones.

## Test Organization Structure

Group tests by API endpoints, function or parameter, not by outcome (error vs. success). Each parameter gets its own test group containing both the "provided" and "omitted" cases.

**Structure example:**
```
describe('first-function-name'):
  describe('first-parameter-name'):
    test('should accept value with expected syntax')
    test('should throw an error if vlue value is syntaxically invalid')
    test('should call sub-method with correct value when provided')
    test('should not call sub-method when parameter omitted')
    ...
  describe('second-parameter-name')
  ...
describe('second-function-name')
...
```

**Why:** Makes it easy to understand all aspects of a single parameter; improves test discoverability.

**Group examples:**
- `describe('model-name/POST endpoint', ...)`
- `describe('function foo()', ...)`

## Test Description Format

Every test description must start with "should" to clearly state expected behavior.

**Examples:**
- ✅ "should call split() with the correct separator" / ❌ "split() is called with the correct separator"
- ✅ "should not call split() when input is empty" / ❌ "split() not called when input is empty"

**Why:** Creates consistent, behavior-focused documentation; makes expected behavior immediately clear.

## Unit Tests

### Unit Tests: Code Responsibility

Unit tests focus exclusively on your code's behavior, not on the behavior of functions it calls.

**Core principle:** Only test the behavior of the function under test. Any function your code calls—whether from a library or another part of your codebase—should be assumed to work correctly and should not be tested.

**Why:** Focuses on the responsibility of your function; avoids redundant testing of dependencies; tests remain valid when dependencies change or internal functions are refactored.

**Good examples:**
- Test that you called `str.split()` with the correct separator ✅ (your responsibility: passing correct args)
- Test that you correctly trimmed and lowercased the string before passing it on ✅ (your responsibility: transformation logic)
- Test that you correctly filtered the array before passing it to the aggregation function ✅ (your responsibility: filtering logic)

**Bad examples:**
- Test that `str.split()` correctly split the string ❌ (standard library's responsibility)
- Test that `str.toLowerCase()` correctly lowercased the string ❌ (standard library's responsibility)
- Test that `arr.filter()` correctly filtered the array ❌ (standard library's responsibility)

**The key question:** Before writing any test, ask: "Who is responsible for this behavior — my code, or a dependency?" If the answer is a dependency, don't test it.

### Unit Tests: Parameter Passing Verification

Use stubs to directly verify that called methods are called with correct parameters. Do not infer parameter passing from output behavior.

**Why:** Tests the implementation contract explicitly; catches parameter mismatches without relying on behavior inference; enables verification that methods are NOT called when parameters are omitted.

### Unit Tests: Edge Case Testing

For error conditions, test both the failure case AND the success boundary case.

**Example - Empty array:**
- ✅ "should throw error for empty array" (error case)
- ✅ "should not throw error for array with a single element" (success boundary)

**Why:** Ensures error checks are precise; prevents false positives; documents what inputs ARE allowed.

## Integration Tests

Not used in this project

## Project's Test Stack

- **[Tape](https://github.com/substack/tape)** — test runner and assertions
- **[Sinon.js](https://sinonjs.org/)** — spies and stubs for parameter verification

Test files live in the `test/` directory: `test/compute.test.js` and `test/server.test.js`.

## Project's Test Scope: for now, Unit Tests only

This project currently focuses on **unit testing**. Integration tests are not part of the current strategy, but this may evolve as the project grows or deployment patterns change.

**Rationale:** The MCP server is a thin wrapper around the stable, battle-tested d3-voronoi-map library. Unit tests provide sufficient regression protection for the wrapper layer. If the project grows in complexity or integration concerns arise, integration testing can be revisited.

**If integration tests are ever added:** They would live in `test/integration.test.js` and follow the patterns defined in the [Integration Tests](#integration-tests) section of this document.

## Running Tests

```bash
yarn test
```
