import Rx from 'rx';

import { createReduce } from './hooks';
import { createTree } from './tree';
import { pick, isObservable } from '../utils';
import { throwFinalizedError, throwChildrenError } from '../errors';

const exposedNodeProps = [
  'reduce',
  'asObservable',
  'setInitialState',
  'connect',
  'compose'
];

export const createNodeAccessor = node => (path, value) => {
  const keys = path.split('.');
  return keys.reduce((acc, key, i) => {
    if (typeof value !== 'undefined' && i === keys.length - 1) {
      return acc.child(key, value);
    }
    return acc.child(key)
  }, node);
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
    wrapInPublish(createNodeAccessor(nodeProps)),
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

  const accessor = createNodeAccessor(nodeProps);

  const compose = nodeProps.compose = wrapInPublish((nodeMap) => createComposedNode({
    nodeMap,
    accessor,
    pauser,
    hookMap
  }));

  const node = Object.assign(
    wrapInPublish(accessor),
    nodeProps
  );

  nodeSubject.onNext(node);

  return node;
};

const createComposedNode = ({
  nodeMap,
  accessor,
  pauser,
  hookMap
}) => {
  const nodeSubject = new Rx.ReplaySubject(1);
  const keys = Object.keys(nodeMap);
  const compositeAccessor = (key) => {
    const path = nodeMap[key];
    if (typeof path === 'undefined') {
      throw new Error(`Key ${key} not found on composite node`);
    }
    return accessor(nodeMap[key]).nodeSubject.getValue();
  };
  const combinedObservable = Rx.Observable
    .combineLatest(
      ...keys.map(key => {
        const path = nodeMap[key];
        const node = accessor(path);
        if (!node) {
          throw new Error(
            `Bad path to node: ${path}
            Cannot compose nodes that have not been previously defined.`
          );
        }
        return node.nodeSubject;
      })
    )
    .flatMapLatest(nodes => {
      return Rx.Observable
        .combineLatest(
          ...nodes.map(node => {
            return node.combinedObservable
          })
        )
        .map(values => {
            return values.reduce((acc, val, i) => {
              return Object.assign({}, acc, {
                [keys[i]]: val
              });
            }, {})
          }
        )
    })
    .pausable(pauser);
  const externalObservable = combinedObservable.shareReplay(1);
  const reduce = createReduce(
    combinedObservable,
    nodeSubject.asObservable(),
    hookMap,
    pauser
  );
  const setNextState = (state) => {
    const newKeys = Object.keys(state);
    newKeys.forEach(key => {
      accessor(nodeMap[key]).nodeSubject
        .getValue()
        .setNextState(state[key]);
    });
  };
  const asObservable = () => externalObservable;
  // Non implemented functions
  const compose = () => {
    throw new Error('Composite nodes cannot be further composed');
  }
  const connect = () => {
    throw new Error(
      `Composite nodes cannot be connected.
      Connect from the original state tree`
    );
  };
  const setInitialState = () => {
    throw new Error(
      `Cannot set initial state on a composite node
      Set initial state from the original state tree`
    )
  }

  const node = Object.assign(
    wrapInPublish(compositeAccessor),
    {
      nodeSubject,
      reduce,
      setNextState,
      compose,
      connect,
      asObservable,
      setInitialState
    }
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

// arrow functions don't have `arguments`
export const wrapInPublish = (accessor) => function() {
  return publishNode(accessor.apply(null, arguments));
};

export const publishNode = node => Object.assign(function() {
  return node.apply(null, arguments);
}, pick(node, exposedNodeProps));
