import test from 'ava';
import Rx from 'rx';

import { createState } from '../../dist/state';

test('should be able to hook into tree node on next and error', t => {
  const testErr = new Error('bar');
  const testVal = 42;
  const initialVal = {
    a: 1,
    b: 2
  };
  const finalVals = [
    {
      a: 43,
      b: 44
    }, {
      a: 45,
      b: 46
    }
  ]
  const state = createState();
  const action = new Rx.Subject();
  state('foo.bar', initialVal).hookReducers(action)
    .next((state, val) => {
      t.deepEqual(state, initialVal);
      t.is(val, testVal);
      return finalVals[0]
    })
    .error((state, err) => {
      t.deepEqual(state, finalVals[0])
      t.is(err, testErr);
      return finalVals[1];
    });

  t.plan(5);

  state('foo.bar').asObservable().skip(1).take(2).toArray()
    .subscribe(vals => t.deepEqual(vals, finalVals));

  state.connect();

  action.onNext(testVal);
  action.onError(testErr);
});

test('should be able to hook into leaf node on next and error', t => {
  const testErr = new Error('baz');
  const testVal = 42;
  const initialVal = 12;
  const finalVals = [54, 66]
  const state = createState();
  const action = new Rx.Subject();

  state('foo.bar', initialVal).hookReducers(action)
    .next((state, val) => {
      t.is(state, initialVal);
      t.is(val, testVal);
      return finalVals[0];
    })
    .error((state, err) => {
      t.is(state, finalVals[0]);
      t.is(err, testErr);
      return finalVals[1];
    });

  t.plan(5);


  state('foo.bar').asObservable().skip(1).take(2).toArray()
    .subscribe(vals => t.deepEqual(vals, finalVals));

  state.connect();

  action.onNext(testVal);
  action.onError(testErr);
});

test('should be able to hook into multiple observables', t => {
  const finalVals = [
    [
      1,
      null
    ],
    [
      1,
      2
    ]
  ]
  const state = createState();
  const action1 = new Rx.Subject();
  const action2 = new Rx.Subject();
  state('foo.bar', null).hookReducers(action1, action2)
    .next((state, vals) => {
      return vals;
    })

  t.plan(1);


  state('foo.bar').asObservable().skip(1).take(2).toArray()
    .subscribe(vals => t.deepEqual(vals, finalVals));

  state.connect();

  action1.onNext(finalVals[0][0]);
  action2.onNext(finalVals[1][1]);
});
