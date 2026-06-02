import { voronoiMapSimulation } from "d3-voronoi-map";
import { polygonHull } from "d3-polygon";
import seedrandom from "seedrandom";

function computeConvexHull(polygon) {
  const convexhull = polygonHull(polygon);
  if (convexhull === null || convexhull.length < 3) {
    throw new Error('Shape defines a degenerated polygon with less than 3 non-duplicate points');
  }
  return convexhull;
}

export function computeVoronoiMap({ shape, data, convergenceRatio, maxIterationCount, minWeightRatio, seed }, _simulationFactory = voronoiMapSimulation) {
  // Run simulation synchronously
  let simulation = _simulationFactory(data);

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
    polygon: polygon,
    datum: polygon.site.originalObject.data.originalData
  }));

  return result;
}
