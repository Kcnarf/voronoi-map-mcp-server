# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for computing Voronoi maps. It wraps the `d3-voronoi-map` JavaScript library and exposes a single MCP tool that partitions a convex polygon into cells whose areas represent the weights of input data points.

The server communicates via stdio and is intended to run inside Claude Desktop.

## Architecture

**Language**: JavaScript (Node.js)  
**Module system**: ESM  

**Source files**:
- `src/index.js` — MCP entry point, starts stdio transport
- `src/server.js` — Server factory (`createServer()`) and tool handler (`handleComputeVoronoiMap()`)
- `src/compute.js` — Pure computation logic (`computeVoronoiMap()`)

**Tool**: `compute_voronoi_map`
- **Input**: `data` (required, array of objects with `id` and `weight`); `shape` (optional, array of [x,y] coordinates); optional tuning parameters (`seed`, `maxIterationCount`, `convergenceRatio`, `minWeightRatio`)
- **Output**: Array of `{polygon: [[x,y], ...], datum: {...}}` objects representing the tessellation
- **Behavior**: Optionally computes convex hull of input polygon, runs Voronoi simulation synchronously until convergence, preserves extra fields from input data

## Common Commands

```bash
yarn install            # Install dependencies
yarn start              # Run the MCP server on stdio
yarn test               # Run test suite (41 tests, organized by functionality)
```

## Integration with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "voronoi-map": {
      "command": "node",
      "args": ["/path/to/voronoi-map-mcp-server/src/index.js"]
    }
  }
}
```

Then reload Claude Desktop to see the `compute_voronoi_map` tool available.

## Implementation Details

**Polygon handling** (`src/compute.js`):
- Computes convex hull via `d3-polygon`'s `polygonHull()` if shape is provided
- Validates hull has ≥3 non-duplicate points via shoelace formula area check
- Only applies `.clip()` to simulation if shape is explicitly provided

**Conditional parameter application**:
- Parameters only applied to simulation if explicitly provided (`if (x !== undefined)`)
- Allows d3-voronoi-map defaults to be used when parameters omitted
- Each parameter has its own conditional: `shape`, `seed`, `maxIterationCount`, `convergenceRatio`, `minWeightRatio`

**Synchronous execution** (`src/compute.js`):
- Calls `.stop()` to prevent auto-running, then manually iterates with `.tick()`
- Stops when `state().ended` is true (convergence or maxIterationCount reached)

**Datum extraction** (`src/compute.js`):
- Extracts original data via `polygon.site.originalObject.data.originalData`
- Preserves all input fields including passthrough fields (via Zod `.passthrough()`)
- Weight in datum is original value, not internally clamped value

## Testing

The project includes 49 regression tests organized by functionality:
- **Datum extraction** — verifies data preservation through d3 internals
- **Seed determinism** — ensures reproducible results with seedrandom
- **Parameter tests** — validates each optional parameter (seed, shape, maxIterationCount, minWeightRatio, convergenceRatio) using Sinon.js for direct method call verification
- **Hull error handling** — tests degenerate polygon detection and edge cases
- **MCP layer** — validation error handling, runtime error handling, response formatting

See `TESTING.md` for detailed testing conventions and patterns.

### Testing Conventions for Claude

When writing or modifying tests, follow these conventions:

0. **Test code responsibility, not dependencies** — Test your code's behavior (error formatting, control flow), not library behavior (validation rules). See TESTING.md "Test Code Responsibility" section for details and examples.
1. **Test descriptions start with "should"** — e.g., "should call .clip() with convex hull"
2. **Group tests by parameter** — one top-level test group per parameter, containing both "provided" and "omitted" cases
3. **Use Sinon.js for parameter verification** — directly verify d3-voronoi-map method calls rather than inferring from output
4. **Test edge case boundaries** — for error conditions, test both failure AND success boundary cases (e.g., collinear vertices with zero area vs. valid area)

**Example test structure:**
```javascript
test('shape parameter', (t) => {
  t.test('should call .clip() with convex hull', (t) => {
    const mockSimulation = createMockSimulation();
    const factory = sinon.stub().returns(mockSimulation);
    computeVoronoiMap({ data, shape: [...], seed: 'test' }, factory);
    t.ok(mockSimulation.clip.calledOnce, '.clip() called once');
    t.end();
  });

  t.test('should not call .clip() when shape omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const factory = sinon.stub().returns(mockSimulation);
    computeVoronoiMap({ data, seed: 'test' }, factory);
    t.notOk(mockSimulation.clip.called, '.clip() not called');
    t.end();
  });
});
```

See `TESTING.md` for comprehensive testing guidance applicable to all contributors.

## Future Enhancements

- ✅ Seeded random number generation for reproducibility (already implemented via `seed` parameter)
- ✅ Simulation tuning parameters (already implemented: `convergenceRatio`, `maxIterationCount`, `minWeightRatio`)
- ⚠️ Convergence metadata to response (iterationCount, final convergenceRatio achieved)
- ⚠️ Input validation for convexity checks (currently only errors on degenerate shapes)
