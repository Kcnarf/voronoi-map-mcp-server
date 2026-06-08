# AGENTS.md

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) working on this repository.


## Workflow & Agent-Human Interaction Guidelines

This project supports two AI execution modes: Standard and Strict Maintainer (Reason->Act, strict code/test separation).

**Initialization Check:**
When starting a new session, or when the user asks to implement a new feature or non-trivial change, proactively ask ONE brief question before starting:
> "Do you want me to use the Maintainer's Strict Workflow (Reason->Act, strict code/test separation) for this task, or standard execution?"

- Do not ask this question for trivial tasks (e.g., fixing a typo, explaining code).
- If the user chooses "Standard", proceed normally with the domain rules defined in this file.
- If the user chooses "Strict", use the following human-agent interaction directives :
  - **use the agentic ReAct (Reason->Act) workflow** :
    1. reason/plan
    2. wait for human approval of the plan
    3. transform the plan into a TODO list
    4. act by implementing the tasks of the TODO list
    note: of course, developments and brainstorming with the human may impact the TODO list; in such a case, inform the human and ask for its approval
  - **clear separation of coding and testing tasks**: imperatively maintain strict separation between code and test changes, with Human-in-the-Loop (HITL) checkpoints. Two acceptable orderings:
    - **TDD (preferred)**: Update tests → wait for human approval → write implementation → wait for human approval → run tests (they should pass)
    - **Code-first**: Change code → wait for human approval → run tests → surface failures to human → propose test updates → wait for human approval → apply test fixes
  - **For multi-file changes**: If a task requires changes to more than 3 source files, stop and break it into smaller tasks first.
  - **Commits**: Never commit changes; the project maintainer handles this.

## Project Overview

This is a Model Context Protocol (MCP) server for computing Voronoi maps. It wraps the `d3-voronoi-map` JavaScript library and exposes a single MCP tool that partitions a convex polygon into cells whose areas represent the weights of input data points.

The server is a local MCP server, which communicates via stdio.

## Architecture

**Language**: JavaScript (Node.js 18 or 20)  
**Module system**: ESM  

**Source files**:
- `src/index.js` — MCP entry point, starts stdio transport
- `src/server.js` — Server factory (`createServer()`) and tool handler (`handleComputeVoronoiMap()`)
- `src/compute.js` — Pure computation logic (`computeVoronoiMap()`)

**Tool**: `compute_voronoi_map`
- **Input**: `data` (required, array of objects with `id` and `weight`); `shape` (optional, array of [x,y] coordinates); optional tuning parameters (`seed`, `maxIterationCount`, `convergenceRatio`, `minWeightRatio`)
- **Output**: Object `{ cells: [{polygon: [[x,y], ...], site: [x,y], datum: {...}}, ...] }` representing the tessellation. Each cell includes the polygon boundary vertices, the site coordinate (ideal for label placement), and the original input datum with all properties preserved
- **Behavior**: Optionally computes convex hull of input polygon, runs Voronoi simulation synchronously until convergence, extracts site coordinates from converged polygon, preserves extra fields from input data

## Common Commands

```bash
yarn install            # Install dependencies
yarn start              # Run the MCP server on stdio
yarn test               # Run test suite
```

## Implementation Details

**Polygon handling** (`src/compute.js`):
- Computes convex hull via `d3-polygon`'s `polygonHull()` if shape is provided
- Validates hull has ≥3 non-duplicate points (null or short hull → throws)
- Only applies `.clip()` to simulation if shape is explicitly provided

**Conditional parameter application**:
- Parameters only applied to simulation if explicitly provided (`if (x !== undefined)`)
- Allows d3-voronoi-map defaults to be used when parameters omitted
- Each parameter has its own conditional: `shape`, `seed`, `maxIterationCount`, `convergenceRatio`, `minWeightRatio`

**Synchronous execution** (`src/compute.js`):
- Calls `.stop()` to prevent auto-running, then manually iterates with `.tick()`
- Stops when `state().ended` is true (convergence or maxIterationCount reached)

**Simulation factory / testability seam** (`src/compute.js`):
- `computeVoronoiMap()` accepts an optional `_simulationFactory` second parameter (defaults to the real `voronoiMapSimulation`)
- Tests pass a stub factory to intercept simulation method calls without running the full algorithm
- Never pass this parameter from production code — it exists solely for testing

**Datum and site extraction** (`src/compute.js`):
- Extracts original data via `polygon.site.originalObject.data.originalData`
- Extracts site coordinates via `polygon.site.x` and `polygon.site.y` (from d3-voronoi-map's Lloyd relaxation)
- Preserves all input fields including passthrough fields (via Zod `.passthrough()`)
- Weight in datum is original value, not internally clamped value
- Site coordinate equals the geometric centroid of the polygon at convergence (since Lloyd relaxation repositions the site to the cell center)

**Error formatting** (`src/server.js`):
- Two error categories, each with a distinct prefix in the MCP response text:
  - Zod validation failure: `"Validation error: <joined messages>"`
  - Runtime error (e.g. degenerate polygon): `"Error computing Voronoi map: <error.message>"`
- Both set `isError: true` in the MCP response

## Testing

The project includes a comprehensive test suite. See `TESTING.md` for detailed testing conventions, organization, and guidance for all contributors.
