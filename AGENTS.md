# AGENTS.md

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working on this repository.

## Working Guidelines

- **Before implementing non-trivial tasks**: Create and present an implementation plan for approval before starting the implementation.
- **For multi-file changes**: If a task requires changes to more than 3 source files, stop and break it into smaller tasks first.
- **Commits**: Never commit changes; the project maintainer handles this.

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
yarn test               # Run test suite
```

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

The project includes a comprehensive test suite. See `TESTING.md` for detailed testing conventions, organization, and guidance for all contributors.
