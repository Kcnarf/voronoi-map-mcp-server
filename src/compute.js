import { voronoiMapSimulation } from "d3-voronoi-map";
import { polygonHull } from "d3-polygon";
import seedrandom from "seedrandom";

// Compute convex hull to ensure clip is convex, hole-free, and counterclockwise
function computeConvexHull(polygon) {
  const convexhull = polygonHull(polygon);
  if (convexhull.length < 3) {
    throw new Error('Shape defines a degenerated polygon with less than 3 non-duplicate points');
  }

  // Validate that the hull encloses a valid area using shoelace formula
  let area = 0;
  for (let i = 0; i < convexhull.length; i++) {
    const [x1, y1] = convexhull[i];
    const [x2, y2] = convexhull[(i + 1) % convexhull.length];
    area += x1 * y2 - x2 * y1;
  }

  if (area === 0) {
    throw new Error('Shape defines a degenerate polygon with zero area (e.g., with collinear points)');
  }

  return convexhull;
}

export function computeVoronoiMap({ shape, data, convergenceRatio, maxIterationCount, minWeightRatio, seed }) {
  // Run simulation synchronously
  let simulation = voronoiMapSimulation(data);

  // Only call .clip() if shape was explicitly provided
  if (shape !== undefined) {
    const convexShape = computeConvexHull(shape);
    simulation = simulation.clip(convexShape);
  }

  // Only set convergenceRatio if explicitly provided
  if (convergenceRatio !== undefined) {
    simulation = simulation.convergenceRatio(convergenceRatio);
  }

  // Only set maxIterationCount if explicitly provided
  if (maxIterationCount !== undefined) {
    simulation = simulation.maxIterationCount(maxIterationCount);
  }

  // Only set minWeightRatio if explicitly provided
  if (minWeightRatio !== undefined) {
    simulation = simulation.minWeightRatio(minWeightRatio);
  }

  // Only set prng if seed is explicitly provided
  if (seed !== undefined) {
    simulation = simulation.prng(seedrandom(seed));
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

  return result;
}
