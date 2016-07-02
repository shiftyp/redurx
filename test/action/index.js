import Rx from 'rx';
import test from 'ava';

import { createAction, connectAction } from '../../dist/action';

test('createAction should return a function', t => {
  const action = createAction();
  t.true(typeof action === 'function');
});

test('createAction should accept a callback', t => {
  const testVal = 1;
  const cb = (obs) => {
    t.true(obs instanceof Rx.Observable);
    return obs.map((val) => val + 1);
  };
  t.plan(3);
  const action = createAction(cb);
  const observable = action.asObservable();
  t.true(observable instanceof Rx.Observable);
  observable.subscribe(val => t.is(val, testVal + 1));
  action(testVal);
});

test('createAction should accept no arguments', t => {
  const action = createAction();
  t.true(action.asObservable() instanceof Rx.Observable);
});

test('action should push a passed value onto the stream', t => {
  const testValue = {};
  const action = createAction();
  const subscription = action.asObservable().subscribe(
    value => t.is(value, testValue),
    err => t.fail(err)
  );
  t.plan(1);
  action(testValue);
});
