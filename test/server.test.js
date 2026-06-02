import test from 'tape';
import { handleComputeVoronoiMap } from '../src/server.js';

test('Validation error handling', (t) => {
  t.test('should return validation error with correct prefix when input is invalid', async (t) => {
    const result = await handleComputeVoronoiMap({ data: [] });

    t.equal(result.isError, true, 'should have isError flag');
    t.equal(result.content[0].type, 'text', 'should have text content type');
    t.ok(result.content[0].text.startsWith('Validation error:'), 'should start with "Validation error:" prefix');
    t.end();
  });

  t.test('should include error details in validation error message', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: -5 }]
    });

    t.equal(result.isError, true, 'should have isError flag');
    const msg = result.content[0].text;
    t.ok(msg.startsWith('Validation error:'), 'should start with "Validation error:" prefix');
    t.ok(msg.length > 'Validation error:'.length, 'should include error details');
    t.end();
  });
});

test('Runtime error handling', (t) => {
  t.test('should return runtime error with correct prefix when computation fails', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      shape: [[0, 0], [1, 1], [2, 2]]
    });

    t.equal(result.isError, true, 'should have isError flag');
    t.equal(result.content[0].type, 'text', 'should have text content type');
    const msg = result.content[0].text;
    t.ok(msg.startsWith('Error computing Voronoi map:'), 'should start with "Error computing Voronoi map:" prefix');
    t.ok(msg.length > 'Error computing Voronoi map:'.length, 'should include error details');
    t.end();
  });
});

test('Success response formatting', (t) => {
  t.test('should return JSON array for valid minimal input', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 }
      ]
    });

    t.notOk(result.isError, 'should not have isError flag');
    t.equal(result.content[0].type, 'text', 'should have text content type');

    let parsed;
    try {
      parsed = JSON.parse(result.content[0].text);
    } catch (e) {
      t.fail(`should parse response as valid JSON: ${e.message}`);
      t.end();
      return;
    }

    t.ok(Array.isArray(parsed.cells), 'should return an array under cells key');
    t.equal(parsed.cells.length, 2, 'should return one cell per input item');
    t.end();
  });

  t.test('should accept all optional parameters without error', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      shape: [[0, 0], [1, 0], [1, 1], [0, 1]],
      seed: 's',
      maxIterationCount: 10,
      convergenceRatio: 0.05,
      minWeightRatio: 0.01
    });

    t.notOk(result.isError, 'should not have isError flag');
    t.equal(result.content[0].type, 'text', 'should have text content type');

    let parsed;
    try {
      parsed = JSON.parse(result.content[0].text);
    } catch (e) {
      t.fail(`should parse response as valid JSON: ${e.message}`);
      t.end();
      return;
    }

    t.ok(Array.isArray(parsed.cells), 'should return an array under cells key');
    t.equal(parsed.cells.length, 1, 'should return one cell per input item');
    t.end();
  });
});
