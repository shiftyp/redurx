import test from 'ava';
import Rx from 'rx';

import { createState } from '../../dist/state';

test('should be able to hook into tree node', t => {
  const testErr = new Error('bar');
  const testVal = 42;
  const initialVal = {
    a: 1,
    b: {
      val: 2
    }
  };
  const finalVal = {
    a: 43,
    b: {
      val: 53
    }
  };
  const state = createState();
  const action = new Rx.Subject();

  state('foo.bar').setInitialState(initialVal);

  state('foo.bar').reduce(action, (state, val) => {
    t.deepEqual(state, initialVal);
    t.is(val, testVal);
    return finalVal
  })

  t.plan(3);

  state('foo.bar').asObservable().skip(1)
    .subscribe(val => t.deepEqual(val, finalVal));

  state.connect();

  action.onNext(testVal);
});

test('should be able to hook into leaf node on next and error', t => {
  const testErr = new Error('baz');
  const testVal = 42;
  const initialVal = 12;
  const finalVal = 54
  const state = createState();
  const action = new Rx.Subject();

  state('foo.bar').setInitialState(initialVal);

  state('foo.bar').reduce(action, (state, val) => {
    t.is(state, initialVal);
    t.is(val, testVal);
    return finalVal;
  });

  t.plan(3);

  state('foo.bar').asObservable().skip(1)
    .subscribe(val => t.deepEqual(val, finalVal));

  state.connect();

  action.onNext(testVal);
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
  state('foo.bar', null).reduce([action1, action2], (state, vals) => {
    return vals;
  })

  t.plan(1);


  state('foo.bar').asObservable().skip(1).take(2).toArray()
    .subscribe(vals => t.deepEqual(vals, finalVals));

  state.connect();

  action1.onNext(finalVals[0][0]);
  action2.onNext(finalVals[1][1]);
});

test('An error should be thrown if a reducer returns undefined', t => {
  const state = createState({ foo: 1 });
  const node = state('foo');
  const action = new Rx.Subject();

  node.reduce(action, () => undefined);

  t.throws(() => action.onNext(1));
});

test('An error should be thrown if an error occurs within an action', t => {
  const state = createState({ foo: 1 });
  const node = state('foo');
  const action = new Rx.Subject();

  node.reduce(
    action.doOnNext(() => { throw new Error('bar') }),
    () => 2
  );

  t.throws(() => action.onNext(3));
});
