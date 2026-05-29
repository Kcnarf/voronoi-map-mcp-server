import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { computeVoronoiMap } from "./compute.js";

// Zod schemas for input validation (exported for testing)
export const CoordinatePair = z.tuple([z.number(), z.number()]);

export const DataItemSchema = z.object({
  id: z.string(),
  weight: z.number().positive(),
}).passthrough();

export const InputSchema = z.object({
  data: z.array(DataItemSchema).min(1, "data array must not be empty").describe("Array of data objects to partition into cells. Each object MUST have: 'id' (unique string identifier) and 'weight' (positive number representing relative cell area). Additional properties are preserved and returned in the output 'datum' field. The weight ratio determines how much space each cell occupies. Examples:\n- [{ id: \"A\", weight: 50 }, { id: \"B\", weight: 50 }, { id: \"C\", weight: 100 }] — A and B gets the equal areas, C gets 2x area of A or B\n- [{ id: \"region_1\", weight: 30, label: \"North\", color: \"#FF0000\" }, { id: \"region_2\", weight: 70, label: \"South\", color: \"#00FF00\" }] — extra properties preserved in results"),
  shape: z.array(CoordinatePair).min(3, "shape must have at least 3 vertices").optional().describe("Vertices of a convex polygon (hull) as [[x,y], [x,y], ...]. Non-convex shapes are automatically transformed into their convex hull. Defaults to unit square [[0,0], [1,0], [1,1], [0,1]] if omitted. Coordinates can be in any coordinate system (pixels, normalized 0-1, abstract units, etc.). Output polygon coordinates are returned in the same coordinate system as this input shape. Minimum 3 non-collinear vertices required. Examples:\n- Square: [[0,0], [100,0], [100,100], [0,100]]\n- Triangle: [[0,0], [10,5], [5,10]]\n- Pentagon: [[0,0], [2,0], [3,1.5], [1,3], [-1,1.5]]"),
  seed: z.string().optional().describe("Seed string for reproducible, deterministic results (optional). Pass the same seed to get identical Voronoi layouts across multiple runs. Useful for reproducible reports, testing, or maintaining consistent visualizations. Any string value is valid. Examples:\n- seed: \"run-2026-05-19\" — date-based seed\n- seed: \"map-version-1.0\" — version-based seed\n- seed: \"user-123-session\" — user-session-based seed\nOmit for random results each run."),
  maxIterationCount: z.number().positive().int().optional().describe("Maximum iterations before stopping regardless of convergence (default: 50). The algorithm stops when max iterations are reached OR convergence criteria are met, whichever comes first. Must be positive integer. Typical values:\n- 10-20 — fast, loose approximation\n- 50 — standard balance\n- 100-200 — high precision, more computation\n- 500+ — very high precision for critical visualizations\nNote: Actual iterations needed depends on convergenceRatio and data complexity."),
  convergenceRatio: z.number().positive().max(1).optional().describe("Convergence threshold controlling simulation precision (default: 0.01, range: 0 < value ≤ 1). The algorithm stops when the maximum distance any site moves between iterations falls below this ratio of the shape's dimension. Smaller values produce more accurate results but take longer. Typical values:\n- 0.001 — very precise, 200+ iterations typical\n- 0.01 — standard accuracy, 50-100 iterations typical\n- 0.1 — coarse approximation, 10-20 iterations typical\n- Use smaller values for high-precision visualizations, larger values for performance."),
  minWeightRatio: z.number().positive().max(1).optional().describe("Minimum weight ratio as a fraction of the maximum weight (default: 0.01, range: 0 < value ≤ 1). Sets a floor: any weight below (maxWeight * minWeightRatio) is clamped to that minimum. This prevents very small weights from causing flickering and computational instability during iteration. Examples:\n- weights [100, 50, 10] with minWeightRatio=0.01 → minimum allowed is 100*0.01=1, so 10 stays as 10\n- weights [100, 50, 1] with minWeightRatio=0.01 → minimum is 1, so 1 stays as 1\n- weights [100, 50, 0.5] with minWeightRatio=0.01 → minimum is 1, so 0.5 is clamped to 1\nTypical values:\n- 0.001 — allows very small cells (5% of max weight)\n- 0.01 — standard (1% of max weight)\n- 0.1 — filters out small cells (10% of max weight)\nUse larger values to suppress near-empty cells and reduce visual noise.")
});

export const OutputSchema = z.array(z.object({
  polygon: z.array(CoordinatePair).describe("Array of [x,y] coordinates defining the vertices of the Voronoi cell polygon"),
  datum: z.record(z.any()).describe("Original data object from input with all properties preserved (id, weight, and any custom fields)")
}).describe("Voronoi cell with polygon coordinates and original datum. Output coordinates are in the same system as the input shape"));

// Tool handler (exported for testing)
export async function handleComputeVoronoiMap(args) {
  try {
    const validated = InputSchema.parse(args);
    const result = computeVoronoiMap(validated);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      return {
        content: [{ type: "text", text: `Validation error: ${messages}` }],
        isError: true
      };
    }
    return {
      content: [{ type: "text", text: `Error computing Voronoi map: ${error.message}` }],
      isError: true
    };
  }
}

export function createServer() {
  const server = new McpServer({
    name: "voronoi-map-mcp-server",
    version: "0.1.0"
  });

  server.tool("compute_voronoi_map", "**tags:** visualization, part-to-whole, voronoi\n\n**description:**\n\nComputes a Voronoi map by partitioning a convex shape based on weighted data points. Each cell's area represents the relative weight of its corresponding data point. If no shape is provided, defaults to a unit square.\n\nReturns array of cells with polygon coordinates (unit square by default) and original datum. Extra input properties are preserved in output.\n\n**EXAMPLE:**\n\nInput:\n```json\n{\n  \"data\": [\n    { \"id\": \"A\", \"weight\": 70, \"label\": \"Category A\" },\n    { \"id\": \"Others\", \"weight\": 30 }\n  ]\n}\n```\n\nOutput:\n```json\n[\n  {\n    \"polygon\": [[0.3,0], [1,0], [1,1], [0.3,1]],\n    \"datum\": { \"id\": \"A\", \"weight\": 70, \"label\": \"Category A\" }\n  },\n  {\n    \"polygon\": [[0,0], [0.3,0], [0.3,1], [0,1]],\n    \"datum\": { \"id\": \"Others\", \"weight\": 30 }\n  }\n]\n```", {
    input: InputSchema,
    output: OutputSchema
  }, handleComputeVoronoiMap);

  return server;
}
