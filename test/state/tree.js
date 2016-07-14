import test from 'ava';
import Rx from 'rx';

import {
  createState
} from '../../dist/state';
import {
  createNode
} from '../../dist/state/node';
import {
  createAction
} from '../../dist/action';

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

  state.reduce(action, (state, val) => val)

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
  node('obj.foo').reduce(fooAction, () => states[1].obj.foo);
  // propogate
  node('obj').reduce(objAction, () => states[2].obj);

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

  node('a').reduce(singleAction, (state, i) => states[i].a);
  node('b').reduce(singleAction, (state, i) => states[i].b);

  node.connect();

  singleAction.onNext(1);
  singleAction.onNext(2);
});

test.cb('children should be pruned if excluded from reduced state', t => {
  const state = createState({ foo: 1, bar: 1 });
  const pruneAction = createAction();
  const testAction = createAction();
  const pruneState = state('bar');

  // The 2 is significant, if changed change
  // pruneState subscription
  pruneState.reduce(testAction, () => 2);

  pruneState.asObservable().subscribe((val) => {
    // Val will equal 2 if the subscription
    // is active when testAction is called.
    // Initial state of 'bar' is expected to
    // be not 2
    if (val === 2) {
      t.fail()
    }
    // completed will be called when a node is
    // pruned, all subscriptions to the node's
    // observable will be disposed as well on
    // the next tick.
  }, null, () => t.pass());

  state.reduce(pruneAction, state => ({ foo: 1 }));

  state.connect();

  t.plan(1);

  pruneAction();

  // Test that subscriptions have been disposed
  setTimeout(() => testAction() || t.end());
});

test('reducers should be able to add children dynamically if in reduced state', t => {
  const state = createState({ foo: 1 });
  const addAction = createAction();

  state.reduce(addAction, () => ({ foo: 1, bar: 1, baz: 1 }));

  t.plan(2);

  // This will create a provisional node to be
  // populated by the reducer.
  state('bar')
    .asObservable()
    .subscribe(val => t.is(val, 1));

  state.connect();

  addAction();

  // This node didn't have a provisional node,
  // but we should be able to access the one
  // created by reduce.
  state('baz')
    .asObservable()
    .subscribe(val => t.is(val, 1));

  // Because no provisional node existed when
  // we connected the state, we have to connect
  // the new node here.
  state('baz').connect();
});
