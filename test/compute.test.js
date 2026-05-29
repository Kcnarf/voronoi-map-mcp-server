import test from 'tape';
import { computeVoronoiMap } from '../src/compute.js';

test('Datum extraction', (t) => {
  t.test('id and weight match original input', (t) => {
    const inputData = [
      { id: 'alpha', weight: 42 },
      { id: 'beta', weight: 7 }
    ];
    const result = computeVoronoiMap({
      data: inputData,
      seed: 'test'
    });

    for (let i = 0; i < result.length; i++) {
      const cell = result[i];
      const matchingInput = inputData.find(d => d.id === cell.datum.id);
      t.ok(matchingInput, `cell ${i} datum.id matches input`);
      t.equal(cell.datum.id, matchingInput.id, `cell ${i} id matches`);
      t.equal(cell.datum.weight, matchingInput.weight, `cell ${i} weight matches`);
    }
    t.end();
  });

  t.test('passthrough fields preserved in datum', (t) => {
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

  t.test('weight is original value, not internally clamped', (t) => {
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

test('Seed determinism', (t) => {
  t.test('same seed produces identical output on two calls', (t) => {
    const args = {
      data: [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 }
      ],
      seed: 'determinism-test'
    };

    const result1 = computeVoronoiMap(args);
    const result2 = computeVoronoiMap(args);

    const json1 = JSON.stringify(result1);
    const json2 = JSON.stringify(result2);
    t.equal(json1, json2, 'same seed produces identical output');
    t.end();
  });

  t.test('different seeds produce different output', (t) => {
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
});

test('Parameter application', (t) => {
  t.test('shape parameter changes output', (t) => {
    const data = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 1 }
    ];

    const resultDefault = computeVoronoiMap({
      data,
      seed: 'test'
    });

    const resultCustom = computeVoronoiMap({
      data,
      shape: [[0, 0], [100, 0], [100, 100], [0, 100]],
      seed: 'test'
    });

    const json1 = JSON.stringify(resultDefault);
    const json2 = JSON.stringify(resultCustom);
    t.notEqual(json1, json2, 'providing shape produces different output than omitting it');
    t.end();
  });

  t.test('maxIterationCount parameter changes output', (t) => {
    const data = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 1 }
    ];

    const resultDefault = computeVoronoiMap({
      data,
      seed: 'test'
    });

    const resultOneIter = computeVoronoiMap({
      data,
      maxIterationCount: 1,
      seed: 'test'
    });

    const json1 = JSON.stringify(resultDefault);
    const json2 = JSON.stringify(resultOneIter);
    t.notEqual(json1, json2, 'maxIterationCount:1 produces different output than default 50');
    t.end();
  });

  t.test('minWeightRatio parameter changes output (clamping effect)', (t) => {
    const data = [
      { id: 'a', weight: 100 },
      { id: 'b', weight: 10 },
      { id: 'c', weight: 1 }
    ];

    const resultDefault = computeVoronoiMap({
      data,
      seed: 'test'
    });

    const resultClamped = computeVoronoiMap({
      data,
      minWeightRatio: 1,
      seed: 'test'
    });

    const json1 = JSON.stringify(resultDefault);
    const json2 = JSON.stringify(resultClamped);
    t.notEqual(json1, json2, 'minWeightRatio:1 produces dramatically different output (equal areas) vs default');

    const defaultB = resultDefault.find(c => c.datum.id === 'b');
    const clampedB = resultClamped.find(c => c.datum.id === 'b');

    t.ok(defaultB && clampedB, 'both results have cell b');
    t.notEqual(JSON.stringify(defaultB.polygon), JSON.stringify(clampedB.polygon),
      'cell b polygon differs significantly with minWeightRatio:1');
    t.end();
  });

  t.test('convergenceRatio parameter changes output', (t) => {
    const data = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 2 }
    ];

    const resultDefault = computeVoronoiMap({
      data,
      seed: 'test'
    });

    const resultLoose = computeVoronoiMap({
      data,
      convergenceRatio: 1,
      seed: 'test'
    });

    const json1 = JSON.stringify(resultDefault);
    const json2 = JSON.stringify(resultLoose);
    t.notEqual(json1, json2, 'convergenceRatio:1 (loose) produces different output than default (tight 0.01)');
    t.end();
  });
});

test('Hull error handling', (t) => {
  t.test('collinear shape throws degenerate polygon error', (t) => {
    try {
      computeVoronoiMap({
        data: [{ id: 'a', weight: 1 }],
        shape: [[0, 0], [1, 1], [2, 2]]
      });
      t.fail('should have thrown an error');
    } catch (error) {
      t.ok(error.message.includes('less than 3') || error.message.includes('zero area'), 'error mentions degenerate polygon');
      t.end();
    }
  });

  t.test('duplicate points shape throws error', (t) => {
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
});
