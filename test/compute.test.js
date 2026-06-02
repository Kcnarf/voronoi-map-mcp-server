import test from 'tape';
import sinon from 'sinon';
import { computeVoronoiMap } from '../src/compute.js';

// Helper to create mock simulation for testing parameter passing
function createMockSimulation() {
  return {
    clip: sinon.stub().returnsThis(),
    convergenceRatio: sinon.stub().returnsThis(),
    maxIterationCount: sinon.stub().returnsThis(),
    minWeightRatio: sinon.stub().returnsThis(),
    prng: sinon.stub().returnsThis(),
    stop: sinon.stub().returnsThis(),
    tick: sinon.stub(),
    state: sinon.stub().returns({
      ended: true,
      polygons: []
    })
  };
}

test('Datum extraction', (t) => {
  t.test('should match original input for id and weight', (t) => {
    const inputData = [
      { id: 'alpha', weight: 42 },
      { id: 'beta', weight: 7 }
    ];
    const result = computeVoronoiMap({
      data: inputData,
      seed: 'test'
    });

    t.equal(result.length, inputData.length, 'result length matches input length');
    for (let i = 0; i < result.length; i++) {
      const cell = result[i];
      const matchingInput = inputData.find(d => d.id === cell.datum.id);
      t.ok(matchingInput, `cell ${i} datum.id matches input`);
      t.equal(cell.datum.id, matchingInput.id, `cell ${i} id matches`);
      t.equal(cell.datum.weight, matchingInput.weight, `cell ${i} weight matches`);
    }
    t.end();
  });

  t.test('should preserve passthrough fields in datum', (t) => {
    const result = computeVoronoiMap({
      data: [{
        id: 'x',
        weight: 10,
        label: 'hello',
        color: '#ff0000',
        count: 99
      }],
      seed: 'test'
    });

    const cell = result[0];
    t.equal(cell.datum.label, 'hello', 'label field preserved');
    t.equal(cell.datum.color, '#ff0000', 'color field preserved');
    t.equal(cell.datum.count, 99, 'count field preserved');
    t.end();
  });

  t.test('should preserve weight as original value, not internally clamped', (t) => {
    const result = computeVoronoiMap({
      data: [
        { id: 'big', weight: 100 },
        { id: 'small', weight: 1 }
      ],
      seed: 'test'
    });

    const smallCell = result.find(cell => cell.datum.id === 'small');
    t.ok(smallCell, 'found small cell');
    t.equal(smallCell.datum.weight, 1, 'weight is original value 1, not clamped');
    t.end();
  });
});

test('Output shape', (t) => {
  t.test('should return polygon as non-empty array of [x,y] coordinate pairs', (t) => {
    const result = computeVoronoiMap({
      data: [{ id: 'a', weight: 1 }, { id: 'b', weight: 2 }],
      seed: 'test'
    });

    for (const cell of result) {
      t.ok(Array.isArray(cell.polygon), 'polygon is an array');
      t.ok(cell.polygon.length > 0, 'polygon has at least one vertex');
      t.ok(
        cell.polygon.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'),
        'all polygon vertices are [x,y] number pairs'
      );
    }
    t.end();
  });
});

test('Seed determinism', (t) => {
  t.test('should produce identical output across multiple calls with same seed', (t) => {
    const args = {
      data: [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 }
      ],
      seed: 'determinism-test'
    };

    const results = [
      JSON.stringify(computeVoronoiMap(args)),
      JSON.stringify(computeVoronoiMap(args)),
      JSON.stringify(computeVoronoiMap(args)),
      JSON.stringify(computeVoronoiMap(args))
    ];

    const allIdentical = results.every(json => json === results[0]);
    t.ok(allIdentical, 'same seed produces identical output across 4+ calls');
    t.end();
  });

  t.test('should produce different output with different seeds', (t) => {
    const data = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 2 }
    ];

    const result1 = computeVoronoiMap({ data, seed: 'seed-A' });
    const result2 = computeVoronoiMap({ data, seed: 'seed-B' });

    const json1 = JSON.stringify(result1);
    const json2 = JSON.stringify(result2);
    t.notEqual(json1, json2, 'different seeds produce different output');
    t.end();
  });

  t.test('should be deterministic with empty string seed', (t) => {
    const args = {
      data: [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 }
      ],
      seed: ''
    };

    const result1 = computeVoronoiMap(args);
    const result2 = computeVoronoiMap(args);

    const json1 = JSON.stringify(result1);
    const json2 = JSON.stringify(result2);
    t.equal(json1, json2, 'empty string seed produces identical output on two calls');
    t.end();
  });

  t.test('should not call .seed() when omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }] }, mockSimulationStub);

    t.notOk(mockSimulation.prng.called,
      '.prng() not called when seed parameter omitted');

    t.end();
  });

  t.test('should call .prng() with a seeded PRNG function when seed provided', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: 'test-seed' }, mockSimulationStub);

    t.ok(mockSimulation.prng.calledOnce, '.prng() called once when seed provided');
    t.equal(typeof mockSimulation.prng.firstCall.args[0], 'function', '.prng() called with a PRNG function');
    t.end();
  });

  t.test('should call .prng() with a seeded PRNG function when seed is empty string', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: '' }, mockSimulationStub);

    t.ok(mockSimulation.prng.calledOnce, '.prng() called once when seed is empty string');
    t.equal(typeof mockSimulation.prng.firstCall.args[0], 'function', '.prng() called with a PRNG function');
    t.end();
  });
});

test('Execution loop', (t) => {
  t.test('should call .stop() to prevent auto-run', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }] }, mockSimulationStub);

    t.ok(mockSimulation.stop.calledOnce, '.stop() called once');
    t.end();
  });

  t.test('should call .tick() multiple times if simulation does not end immediately', (t) => {
    const mockSimulation = createMockSimulation();
    mockSimulation.state = sinon.stub().callsFake(() => ({
      ended: mockSimulation.state.callCount > 2,
      polygons: []
    }));
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }] }, mockSimulationStub);

    t.ok(mockSimulation.tick.calledTwice, '.tick() called twice before simulation ended');
    t.end();
  });
});

test('shape parameter', (t) => {
  t.test('should call .clip() with convex hull', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    const shape = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const data = [{ id: 'a', weight: 1 }];

    computeVoronoiMap({ data, shape, seed: 'test' }, mockSimulationStub);

    t.ok(mockSimulation.clip.calledOnce, '.clip() called once');
    const clipArg = mockSimulation.clip.firstCall.args[0];
    t.equal(clipArg.length, 4, 'convex hull has 4 points');
    t.ok(Array.isArray(clipArg) && clipArg.every(p => Array.isArray(p) && p.length === 2),
      'clip called with array of [x,y] coordinates');

    t.end();
  });

  t.test('should not call .clip() when shape omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: 'test' }, mockSimulationStub);

    t.notOk(mockSimulation.clip.called, '.clip() not called when shape omitted');

    t.end();
  });
});

test('maxIterationCount parameter', (t) => {
  t.test('should call .maxIterationCount() with correct value', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], maxIterationCount: 5, seed: 'test' }, mockSimulationStub);

    t.ok(mockSimulation.maxIterationCount.calledOnceWithExactly(5),
      '.maxIterationCount() called with value 5');

    t.end();
  });

  t.test('should not call .maxIterationCount() when maxIterationCount omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: 'test' }, mockSimulationStub);

    t.notOk(mockSimulation.maxIterationCount.called,
      '.maxIterationCount() not called when parameter omitted');

    t.end();
  });
});

test('minWeightRatio parameter', (t) => {
  t.test('should call .minWeightRatio() with correct value', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], minWeightRatio: 0.5, seed: 'test' }, mockSimulationStub);

    t.ok(mockSimulation.minWeightRatio.calledOnceWithExactly(0.5),
      '.minWeightRatio() called with value 0.5');

    t.end();
  });

  t.test('should not call .minWeightRatio() when minWeightRatio omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: 'test' }, mockSimulationStub);

    t.notOk(mockSimulation.minWeightRatio.called,
      '.minWeightRatio() not called when parameter omitted');

    t.end();
  });
});

test('convergenceRatio parameter', (t) => {
  t.test('should call .convergenceRatio() with correct value', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], convergenceRatio: 0.001, seed: 'test' }, mockSimulationStub);

    t.ok(mockSimulation.convergenceRatio.calledOnceWithExactly(0.001),
      '.convergenceRatio() called with value 0.001');

    t.end();
  });

  t.test('should not call .convergenceRatio() when convergenceRatio omitted', (t) => {
    const mockSimulation = createMockSimulation();
    const mockSimulationStub = sinon.stub().returns(mockSimulation);

    computeVoronoiMap({ data: [{ id: 'a', weight: 1 }], seed: 'test' }, mockSimulationStub);

    t.notOk(mockSimulation.convergenceRatio.called,
      '.convergenceRatio() not called when parameter omitted');

    t.end();
  });
});

test('Hull error handling', (t) => {
  t.test('should handle duplicated points', (t) => {
    t.test('should throw error if duplicate-free polygon has <3 points', (t) => {
      try {
        computeVoronoiMap({
          data: [{ id: 'a', weight: 1 }],
          shape: [[5, 5], [5, 5], [5, 5]]
        });
        t.fail('should have thrown an error');
      } catch (error) {
        t.ok(error.message.includes('less than 3 non-duplicate'), 'error message mentions non-duplicate');
        t.end();
      }
    });

    t.test('should not throw error if duplicate-free polygon has >=3 points', (t) => {
      try {
        const result = computeVoronoiMap({
          data: [{ id: 'a', weight: 1 }],
          shape: [[0, 0], [0, 0], [1, 0], [0, 1]]
        });
        t.ok(Array.isArray(result), 'result is an array (no error thrown)');
        t.equal(result.length, 1, 'result has 1 cell');
        t.end();
      } catch (error) {
        t.fail(`should not have thrown an error: ${error.message}`);
        t.end();
      }
    });
  });

  t.test('should handle collinear vertices', (t) => {
    t.test('should throw error for fully collinear shape', (t) => {
      try {
        computeVoronoiMap({
          data: [{ id: 'a', weight: 1 }],
          shape: [[0, 0], [1, 1], [2, 2]]
        });
        t.fail('should have thrown an error');
      } catch (error) {
        t.ok(error.message.includes('less than 3 non-duplicate'), 'error mentions less than 3 non-duplicate points');
        t.end();
      }
    });

    t.test('should not throw error if some vertices are collinear but shape still define valid area', (t) => {
      try {
        const result = computeVoronoiMap({
          data: [{ id: 'a', weight: 1 }],
          shape: [[0, 0], [1, 0], [1.5, 0], [2, 0], [2, 2], [0, 2]]
        });
        t.ok(Array.isArray(result), 'result is an array (no error thrown)');
        t.equal(result.length, 1, 'result has 1 cell');
        t.end();
      } catch (error) {
        t.fail(`should not have thrown an error: ${error.message}`);
        t.end();
      }
    });
  });
});
