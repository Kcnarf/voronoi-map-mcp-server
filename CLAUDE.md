# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for computing Voronoi maps. It wraps the `d3-voronoi-map` JavaScript library and exposes a single MCP tool that partitions a convex polygon into cells whose areas represent the weights of input data points.

The server communicates via stdio and is intended to run inside Claude Desktop.

## Architecture

**Language**: JavaScript (Node.js)  
**Module system**: ESM  
**Single-file server**: `src/index.js` contains the complete MCP server implementation

**Tool**: `compute_voronoi_map`
- **Input**: `shape` (array of [x,y] coordinates defining a convex polygon) and `data` (array of objects with `id` and `weight`)
- **Output**: Array of `{polygon: [[x,y], ...], datum: {...}}` objects representing the tessellation
- **Behavior**: The server automatically normalizes the input polygon to counterclockwise orientation and runs the Voronoi simulation synchronously until convergence

## Common Commands

```bash
yarn install            # Install @modelcontextprotocol/sdk and d3-voronoi-map
yarn start              # Run the MCP server on stdio
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

- **Polygon normalization**: Uses shoelace formula to detect clockwise orientation and reverses if needed
- **Synchronous execution**: Calls `.stop()` on the simulation and manually iterates with `.tick()` until `state().ended` is true
- **Output cleaning**: Strips d3-voronoi-map internal properties (`.site`) and returns only the user-provided datum and the cell polygon coordinates

## Future Enhancements

- Add `options` parameter for simulation tuning (convergenceRatio, maxIterationCount, minWeightRatio)
- Add convergence metadata to response (iterationCount, convergenceRatio)
- Input validation for convexity checks
- Support for seeded random number generation for reproducibility
