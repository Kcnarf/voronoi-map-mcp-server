import test from 'tape';
import { handleComputeVoronoiMap } from '../src/server.js';

test('Success responses', (t) => {
  t.test('minimal valid call returns success', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 }
      ]
    });

    t.notOk(result.isError, 'should not have isError flag');
    t.equal(result.content[0].type, 'text', 'content type is text');

    let parsed;
    try {
      parsed = JSON.parse(result.content[0].text);
    } catch (e) {
      t.fail(`JSON parse failed: ${e.message}`);
      t.end();
      return;
    }

    t.ok(Array.isArray(parsed), 'parsed result is an array');
    t.equal(parsed.length, 2, 'result array has 2 cells');
    t.end();
  });

  t.test('all optional parameters accepted', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      shape: [[0, 0], [1, 0], [1, 1], [0, 1]],
      seed: 's',
      maxIterationCount: 10,
      convergenceRatio: 0.05,
      minWeightRatio: 0.01
    });

    t.notOk(result.isError, 'should not have isError flag');

    let parsed;
    try {
      parsed = JSON.parse(result.content[0].text);
    } catch (e) {
      t.fail(`JSON parse failed: ${e.message}`);
      t.end();
      return;
    }

    t.ok(Array.isArray(parsed), 'parsed result is an array');
    t.equal(parsed.length, 1, 'result array has 1 cell');
    t.end();
  });
});

test('Zod validation errors', (t) => {
  t.test('empty data array rejected', async (t) => {
    const result = await handleComputeVoronoiMap({ data: [] });

    t.equal(result.isError, true, 'isError is true');
    t.ok(result.content[0].text.startsWith('Validation error:'), 'message starts with "Validation error:"');
    t.end();
  });

  t.test('missing data field rejected', async (t) => {
    const result = await handleComputeVoronoiMap({});

    t.equal(result.isError, true, 'isError is true');
    t.ok(result.content[0].text.startsWith('Validation error:'), 'message starts with "Validation error:"');
    t.end();
  });

  t.test('negative weight rejected', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: -5 }]
    });

    t.equal(result.isError, true, 'isError is true');
    const msg = result.content[0].text;
    t.ok(msg.startsWith('Validation error:'), 'message starts with "Validation error:"');
    t.ok(msg.includes('weight'), 'message mentions "weight"');
    t.end();
  });

  t.test('shape with < 3 vertices rejected', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      shape: [[0, 0], [1, 1]]
    });

    t.equal(result.isError, true, 'isError is true');
    t.ok(result.content[0].text.startsWith('Validation error:'), 'message starts with "Validation error:"');
    t.end();
  });

  t.test('convergenceRatio > 1 rejected', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      convergenceRatio: 2
    });

    t.equal(result.isError, true, 'isError is true');
    t.ok(result.content[0].text.startsWith('Validation error:'), 'message starts with "Validation error:"');
    t.end();
  });
});

test('Runtime errors', (t) => {
  t.test('collinear shape returns runtime error with correct prefix', async (t) => {
    const result = await handleComputeVoronoiMap({
      data: [{ id: 'a', weight: 1 }],
      shape: [[0, 0], [1, 1], [2, 2]]
    });

    t.equal(result.isError, true, 'isError is true');
    const msg = result.content[0].text;
    t.ok(msg.startsWith('Error computing Voronoi map:'), 'message starts with "Error computing Voronoi map:" prefix (not Validation error)');
    t.end();
  });
});
