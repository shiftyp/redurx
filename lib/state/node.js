import Rx from 'rx';

import { createReduce } from './hooks';
import { createTree } from './tree';
import { pick } from '../utils';
import { throwFinalizedError, throwChildrenError } from '../errors';

const exposedNodeProps = [
  'reduce',
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
    const nodeSubject = beforeChildren[key];
    if (!nodeSubject || nodeSubject.getValue().provisional) {
      if (typeof value !== 'undefined') {
        addChildrenSubject.onNext({ action: 'add', key, value, provisional: false });
      } else if (!nodeSubject) {
        addChildrenSubject.onNext({ action: 'add', key, value: null, provisional: true });
      }
    }
    return getChildrenSubject.getValue()[key].getValue();
  };
};

export const createFinalNodeFromProvisionalNode = ({
  observable,
  provisionalNode,
  setNextState,
  setCompleted
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
  if (typeof setCompleted === 'function') {
    nodeProps.setCompleted = setCompleted;
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
  setCompleted,
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
  const reduce = createReduce(
    combinedObservable,
    nodeSubject.asObservable(),
    hookMap,
    pauser
  );
  const connectDisposable = new Rx.CompositeDisposable();
  const connect = () => {
    const children = getChildrenSubject && getChildrenSubject.getValue();
    if (children) {
      const keys = Object.keys(children);
      keys.forEach(key => connectDisposable.add(
        children[key].getValue().connect()
      ));
    }
    connectDisposable.add(
      asObservable().connect()
    );
    return connectDisposable;
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
  const setNodeCompleted = () => {
    setCompleted();
    observableSubject.onCompleted();
    // Dispose on next tick so onComplete handlers
    // will be invoked.
    setTimeout(() => connectDisposable.dispose());
  };

  if (observable) {
    observableSubject.onNext(observable);
  }

  const nodeProps = {
    addChildrenSubject,
    getChildrenSubject,
    reduce,
    child,
    setNextState,
    setCompleted: setNodeCompleted,
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
  setCompleted,
  provisional,
  provisionalNode
}) => {
  if (provisionalNode) {
    return createFinalNodeFromProvisionalNode({
      observable,
      setNextState,
      setCompleted,
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
      setCompleted,
      provisional
    });
  }
};

export const publishNode = node => Object.assign(function() {
  return node.apply(null, arguments);
}, pick(node, exposedNodeProps));
