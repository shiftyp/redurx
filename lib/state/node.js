import Rx from 'rx';

import { createHookReducers } from './hooks';
import { createTree } from './tree';
import { pick } from '../utils';
import { throwFinalizedError, throwChildrenError } from '../errors';

const exposedNodeProps = [
  'hookReducers',
  'asObservable',
  'setInitialState',
  'connect'
];

export const createNodeAccessor = node => (path, value) => {
  const keys = path.split('.');
  return publishNode(keys.reduce((acc, key, i) => {
    if (typeof value !== 'undefined' && i === keys.length - 1) {
      return acc.child(key, value);
    }
    return acc.child(key)
  }, node))
};

export const createChildAccessor = (addChildrenSubject, getChildrenSubject) => {
  return (key, value) => {
    if (!getChildrenSubject) throwChildrenError();
    const beforeChildren = getChildrenSubject.getValue();
    if (!(key in beforeChildren)) {
      if (typeof value !== 'undefined') {
        addChildrenSubject.onNext({ key, value, provisional: false });
      } else {
        addChildrenSubject.onNext({ key, value: null, provisional: true });
      }
    }
    return getChildrenSubject.getValue()[key].getValue();
  };
};

export const createFinalNodeFromProvisionalNode = ({
  observable,
  provisionalNode,
  setNextState
}) => {
  const { observableSubject, nodeSubject } = provisionalNode;

  if (observable) {
    observableSubject.onNext(observable);
  }

  const nodeProps = Object.assign({}, provisionalNode, {
    provisional: false
  });

  if (typeof setNextState === 'function') {
    nodeProps.setNextState = setNextState;
  }

  const node = Object.assign(
    createNodeAccessor(nodeProps),
    nodeProps
  );

  nodeSubject.onNext(node);

  return node;
};

export const createInitialNode = ({
  addChildrenSubject,
  getChildrenSubject,
  pauser,
  observable,
  hookMap,
  setNextState,
  provisional
}) => {
  const observableSubject = new Rx.ReplaySubject(1);
  // Great name right?
  const combinedObservable = observableSubject
    .flatMapLatest(obs => obs);
  const externalObservable = combinedObservable
    .replay();
  const child = createChildAccessor(addChildrenSubject, getChildrenSubject);
  const nodeSubject = new Rx.BehaviorSubject();
  const asObservable = () => externalObservable;
  const hookReducers = createHookReducers(
    combinedObservable,
    nodeSubject.asObservable(),
    hookMap,
    pauser
  );
  const connect = () => {
    const allDisposable = new Rx.CompositeDisposable();
    const children = getChildrenSubject && getChildrenSubject.getValue();
    if (children) {
      const keys = Object.keys(children);
      keys.forEach(key => allDisposable.add(
        children[key].getValue().connect()
      ));
    }
    allDisposable.add(
      asObservable().connect()
    );
    return allDisposable;
  };

  const setInitialState = (initialState) => {
    const currentNode = nodeSubject.getValue()
    if (!currentNode.provisional) {
      throwFinalizedError();
    } else {
      createTree({
        initialState,
        createNode,
        pauser,
        hookMap,
        provisional: false,
        provisionalNode: node
      });
      return publishNode(nodeSubject.getValue());
    }
  };

  if (observable) {
    observableSubject.onNext(observable);
  }

  const nodeProps = {
    addChildrenSubject,
    getChildrenSubject,
    hookReducers,
    child,
    setNextState,
    nodeSubject,
    provisional: !!provisional,
    provisionalNode: !!provisional && node,
    pauser,
    combinedObservable,
    observableSubject,
    asObservable,
    connect,
    setInitialState
  };

  const node = Object.assign(
    createNodeAccessor(nodeProps),
    nodeProps
  );

  nodeSubject.onNext(node);

  return node;
};

export const createNode = ({
  addChildrenSubject,
  getChildrenSubject,
  pauser,
  observable,
  hookMap,
  setNextState,
  provisional,
  provisionalNode
}) => {
  if (provisionalNode) {
    return createFinalNodeFromProvisionalNode({
      observable,
      setNextState,
      provisionalNode
    });
  } else {
    return createInitialNode({
      addChildrenSubject,
      getChildrenSubject,
      pauser,
      observable,
      hookMap,
      setNextState,
      provisional
    });
  }
};

export const publishNode = node => Object.assign(function() {
  return node.apply(null, arguments);
}, pick(node, exposedNodeProps));
