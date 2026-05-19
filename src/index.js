import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/transport/stdio.js";
import { voronoiMapSimulation } from "d3-voronoi-map";
import { z } from "zod";

const server = new McpServer({
  name: "voronoi-map-mcp-server",
  version: "0.1.0"
});

// Zod schemas for input validation
const CoordinatePair = z.tuple([z.number(), z.number()]);

const DataItemSchema = z.object({
  id: z.string(),
  weight: z.number().positive(),
}).passthrough();

const InputSchema = z.object({
  shape: z.array(CoordinatePair).min(3, "shape must have at least 3 vertices").optional(),
  data: z.array(DataItemSchema).min(1, "data array must not be empty")
});

// Normalize polygon to counterclockwise orientation using shoelace formula
function normalizePolygon(polygon) {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    area += x1 * y2 - x2 * y1;
  }
  // Positive area means clockwise; reverse to counterclockwise
  if (area > 0) {
    return polygon.slice().reverse();
  }
  return polygon;
}

server.tool("compute_voronoi_map", "Computes a Voronoi map by partitioning a convex polygon based on weighted data points. Each cell's area represents the relative weight of its corresponding data point. If no shape is provided, defaults to a unit square.", {
  type: "object",
  required: ["data"],
  properties: {
    shape: {
      type: "array",
      description: "Vertices of the convex, hole-free outer polygon as [[x,y], [x,y], ...]. Will be normalized to counterclockwise orientation. Defaults to a unit square [[0,0], [1,0], [1,1], [0,1]] if omitted.",
      items: {
        type: "array",
        items: { type: "number" },
        minItems: 2,
        maxItems: 2
      }
    },
    data: {
      type: "array",
      description: "Array of data objects to partition. Each object must have a unique 'id' (string) and a positive numeric 'weight'. Additional properties are preserved in the output.",
      items: {
        type: "object",
        required: ["id", "weight"],
        properties: {
          id: { type: "string" },
          weight: { type: "number", exclusiveMinimum: 0 }
        },
        additionalProperties: true
      }
    }
  }
}, async (args) => {
  try {
    // Validate input with Zod
    const validated = InputSchema.parse(args);
    const { shape, data } = validated;

    // Run simulation synchronously
    let simulation = voronoiMapSimulation(data);

    // Only call .clip() if shape was explicitly provided
    if (shape !== undefined) {
      const normalizedShape = normalizePolygon(shape);
      simulation = simulation.clip(normalizedShape);
    }

    simulation = simulation.stop();

    // Iterate until convergence or max iterations reached
    while (!simulation.state().ended) {
      simulation.tick();
    }

    // Extract and format results
    const polygons = simulation.state().polygons;
    const result = polygons.map(polygon => ({
      polygon: polygon.map(([x, y]) => [x, y]),
      datum: polygon.site.originalObject.data.originalData
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    // Handle Zod validation errors
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
});

// Connect to stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
