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

  action.onNext(testVal);
  action.onError(testErr);
});

test('should be able to hook into leaf node observable prior to initial state', t => {
  const testVal = 42;
  const initialVal = 12;
  const finalVal = 54;
  const state = createState();
  const action = new Rx.Subject();
  state('foo.bar').hookReducers(action)
    .next((state, val) => {
      t.is(state, initialVal);
      t.is(val, testVal);
      return finalVal;
    });

  t.plan(3);

  state('foo.bar').asObservable().skip(1)
    .subscribe(val => t.is(val, finalVal));

  state('foo.bar').setInitialState(initialVal);

  action.onNext(testVal);
});

test('should be able to hook into tree node observable prior to initial state', t => {
  const testVal = 42;
  const initialVal = {
    a: 1,
    b: 2
  };
  const finalVal = {
    a: 43,
    b: 44
  }
  const state = createState();
  const action = new Rx.Subject();
  state('foo.bar').hookReducers(action)
    .next((state, val) => {
      t.deepEqual(state, initialVal);
      t.is(val, testVal);
      return finalVal;
    });

  t.plan(3);

  state('foo.bar').asObservable().skip(1)
    .subscribe(val => t.deepEqual(val, finalVal));

  state('foo.bar').setInitialState(initialVal);

  action.onNext(testVal);
});
