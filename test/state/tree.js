import test from 'ava';
import Rx from 'rx';

import {
  createState
} from '../../dist/state';
import {
  createNode
} from '../../dist/state/node';

test('createLeaf observable should have initial value', t => {
  const testVal = 2;
  t.plan(1);
  const state = createState(testVal)
  state
    .asObservable()
    .subscribe((val) => t.is(val, testVal));
  state.connect();
});

test('createLeaf observable should send distinct values from setNextState', t => {
  const testVals = [1, 2, 3];
  const state = createState()('foo.bar', testVals[0]);
  const action = new Rx.Subject();

  t.plan(1);

  state.hookReducers(action)
    .next((state, val) => val)

  state
    .asObservable()
    .take(3)
    .toArray()
    .subscribe((vals) => t.deepEqual(vals, testVals));

  state.connect();

  action.onNext(testVals[1]);
  action.onNext(testVals[1]);
  action.onNext(testVals[2]);
  action.onNext(testVals[2]);
});

test('createTree should create leaf nodes for passed children', t => {
  const state = {
    foo: 1,
    bar: 'string',
    baz: true,
    qux: null
  };
  const stateKeys = Object.keys(state).sort();
  const wrappedCreateNode = function({ getChildrenSubject, observable }) {
    let children;

    if (getChildrenSubject) {
      children = getChildrenSubject.getValue();
      t.deepEqual(stateKeys, Object.keys(children).sort());
    } else {
      t.pass();
    }
    return createNode.apply(null, arguments);
  };
  t.plan(stateKeys.length + 1);
  createState(state, wrappedCreateNode);
});

test('createTree should create tree nodes for passed children', t => {
  const state = {
    obj: {
      foo: 1,
      bar: 'string',
      baz: true,
      qux: null
    }
  };
  const nestedStateKeys = Object.keys(state.obj).sort();
  const wrappedCreateNode = function({ getChildrenSubject, observable }) {
    let children;

    if (getChildrenSubject) {
      children = getChildrenSubject.getValue();
      if (!children.hasOwnProperty('obj')) {
        t.deepEqual(nestedStateKeys, Object.keys(children).sort());
      }
    } else {
      t.pass();
    }
    return createNode.apply(null, arguments);
  };
  t.plan(nestedStateKeys.length + 1);
  createState(state, wrappedCreateNode);
});

test('createTree node should combine and propogate child state', t => {
  const states = [{
    obj: {
      foo: 1,
      bar: 'string',
      baz: true,
      qux: null
    }
  },{
    obj: {
      foo: 2,
      bar: 'string',
      baz: true,
      qux: null
    }
  },{
    obj: {
      foo: -1,
      bar: 'someOtherString',
      baz: null,
      qux: true
    }
  }];

  const fooAction = new Rx.Subject();
  const objAction = new Rx.Subject();

  const node = createState(states[0]);

  t.plan(1);

  node.asObservable().take(3).toArray().subscribe((newStates) => {
    t.deepEqual(states, newStates)
  });
  // combine
  node('obj.foo').hookReducers(fooAction).next(() => states[1].obj.foo);
  // propogate
  node('obj').hookReducers(objAction).next(() => states[2].obj);

  node.connect();

  fooAction.onNext(1);
  objAction.onNext(2);
});

test('separate hooks into a single action should lead to one update on parent', t => {
  const states = [{
    a: 1,
    b: 2
  },{
    a: 3,
    b: 4
  },{
    a: 5,
    b: 6
  }];

  const singleAction = new Rx.Subject();

  const node = createState(states[0]);

  t.plan(1);

  node.asObservable().take(3).toArray().subscribe((newStates) => {
    t.deepEqual(states, newStates)
  });

  node('a').hookReducers(singleAction).next((state, i) => states[i].a);
  node('b').hookReducers(singleAction).next((state, i) => states[i].b);

  node.connect();

  singleAction.onNext(1);
  singleAction.onNext(2);
});
