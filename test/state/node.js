import test from 'ava';
import Rx from 'rx';

import { createState } from '../../dist/state';

test('should be able to hook into leaf node observable prior to initial state', t => {
  const testVal = 42;
  const initialVal = 12;
  const finalVal = 54;
  const state = createState();
  const action = new Rx.Subject();

  state.connect();

  state('foo.bar').hookReducers(action)
    .next((state, val) => {
      t.is(state, initialVal);
      t.is(val, testVal);
      return finalVal;
    });

  t.plan(3);

  state('foo.bar').asObservable().skip(1)
    .subscribe(val => t.is(val, finalVal));

  state('foo.bar')
    .setInitialState(initialVal)
    .connect();

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

  state.connect();

  action.onNext(testVal);
});
