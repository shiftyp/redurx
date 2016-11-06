import Rx from 'rx';

import { isPlainObject } from '../utils';
import {
  throwShapeError,
  throwChildrenError,
  throwFinalizedError
} from '../errors';

export const createTreeSetNextState = (
  childrenObservable,
  addChildrenSubject,
  pauser
) => {
  const newStateSubject = new Rx.Subject();
  newStateSubject
    .withLatestFrom(childrenObservable)
    .subscribe(([newState, children]) => {
      const keys = Object.keys(children);
      const newKeys = Object.keys(newState);
      const additionalState = {};
      const pruneState = {};

      newKeys.forEach(key => {
        const child = children[key];
        if (child && !child.getValue().provisional) {
          children[key].getValue().setNextState(newState[key]);
        } else {
          Object.assign(additionalState, { [key]: newState[key] })
        }
      });
      keys.forEach(key => {
        if (!(key in newState)) {
          Object.assign(pruneState, { [key]: true });
        }
      });

      updateAddChildrenSubject(additionalState, pruneState, addChildrenSubject, pauser)
    });

  return (newState) => {
    newStateSubject.onNext(newState);
  };
};

export const createTreeObservable = (childrenObservable) => {
  return childrenObservable
    .flatMapLatest(children => {
      const keys = Object.keys(children);
      return Rx.Observable.combineLatest(
        ...keys.map(key => {
          return children[key]
        })
        ,(...latestNodes) => {
          return latestNodes.reduce((acc, val, i) => {
            if (!val.provisional) {
              acc[keys[i]] = val;
            }
            return acc;
          }, {});
        });
    })
    .flatMapLatest(nodes => {
      const keys = Object.keys(nodes);
      return Rx.Observable
        .combineLatest(
          ...keys
            .map(key => nodes[key].combinedObservable),
          (...latestValues) => {
            return latestValues.reduce((acc, val, i) => {
              acc[keys[i]] = val;
              return acc;
            }, {});
          });
    });
};

export const createChildrenObservable = ({
  addChildrenSubject,
  getChildrenSubject,
  pauser,
  hookMap,
  createNode
}) => {
  return addChildrenSubject
    .withLatestFrom(getChildrenSubject, (child, acc) => {
      const { action, key, value, provisional } = child;
      if (action === 'add') {
        const oldNode = acc[key] && acc[key].getValue();
        if(!oldNode || oldNode.provisional) {
          const newNode = createTree({
            initialState: value,
            pauser,
            hookMap,
            createNode,
            provisional,
            provisionalNode: oldNode
          });
          return Object.assign({}, acc, {
            [key]: newNode.nodeSubject
          });
        } else if (!oldNode.provisional) {
          throwFinalizedError(key);
        } else {
          return acc;
        }
      } else {
        const node = acc[key] && acc[key].getValue();
        if (node) {
          node.setCompleted();
          delete acc[node];
        }
        return acc;
      }
    })
    .shareReplay(1);
};

export const updateAddChildrenSubject = (addState, pruneState, addChildrenSubject, pauser) => {
  const addKeys = Object.keys(addState);
  pauser.onNext(false);
  addKeys.forEach((key) => {
    addChildrenSubject.onNext(
      { action: 'add', key, value: addState[key], provisional: false }
    );
  });
  if (pruneState) {
    const pruneKeys = Object.keys(pruneState);
    pruneKeys.forEach(key => {
      addChildrenSubject.onNext({ action: 'prune', key });
    })
  }
  pauser.onNext(true);
};

export const createFinalTreeFromProvisionalNode = ({
  initialState,
  createNode,
  provisionalNode
}) => {
  const {
    addChildrenSubject,
    pauser
  } = provisionalNode;
  updateAddChildrenSubject(initialState, null, addChildrenSubject, pauser);
  return createNode({
    provisional: false,
    provisionalNode
  });
}

const createInitialTree = ({
  initialState,
  rootPauser,
  hookMap,
  createNode,
  provisional,
  provisionalNode
}) => {
  const pauser = new Rx.BehaviorSubject(true);
  if (rootPauser) rootPauser.subscribe(pauser.onNext.bind(pauser));
  if (!hookMap) {
    hookMap = new WeakMap();
  }
  const addChildrenSubject = new Rx.Subject();
  const getChildrenSubject = new Rx.BehaviorSubject({});
  const childrenObservable = createChildrenObservable({
    addChildrenSubject,
    getChildrenSubject,
    pauser,
    hookMap,
    createNode
  });

  const valueSubject = new Rx.ReplaySubject(1);

  childrenObservable.subscribe(getChildrenSubject)
  childrenObservable.subscribeOnError(err => { throw err });

  if (!provisional) {
    updateAddChildrenSubject(initialState, null, addChildrenSubject, pauser);
  }

  const valueObservable = createTreeObservable(childrenObservable)
    .pausable(pauser);
  const setNextState = createTreeSetNextState(childrenObservable, addChildrenSubject, pauser);
  const setCompleted = () => {
    addChildrenSubject.onCompleted();
    getChildrenSubject.onCompleted();
    valueSubject.onCompleted();
  };

  valueObservable.subscribe(valueSubject);

  const node = createNode({
    addChildrenSubject,
    getChildrenSubject,
    pauser,
    observable: valueSubject.asObservable(),
    hookMap,
    setNextState,
    setCompleted,
    provisional,
    provisionalNode
  });

  return node;
};

export const createLeaf = ({
  initialState,
  pauser,
  createNode,
  hookMap,
  provisionalNode
}) => {
  if (
    provisionalNode &&
    Object.keys(provisionalNode.getChildrenSubject.getValue()).length
  ) {
    throw new Error('Tried to create leaf node when provisional has children');
  }
  if (!pauser) {
    pauser = new Rx.BehaviorSubject(true);
  }
  if (!hookMap) {
    hookMap = new WeakMap();
  }
  const subject = new Rx.BehaviorSubject(initialState);
  const observable = subject
    .distinctUntilChanged();
  const setNextState = (newState) => {
    subject.onNext(newState);
  };
  const setCompleted = () => {
    subject.onCompleted();
  };

  return createNode({
    observable,
    hookMap,
    pauser,
    setNextState,
    setCompleted,
    provisional: false,
    provisionalNode
  });
};

export const createTree = ({
  initialState,
  pauser,
  hookMap,
  createNode,
  provisional,
  provisionalNode
}) => {
  if (typeof initialState === 'undefined') {
    return createInitialTree({
      initialState: null,
      pauser,
      hookMap,
      createNode,
      provisional: true
    });
  } else if (!provisional) {
    if (!isPlainObject(initialState)) {
      return createLeaf({
        initialState,
        pauser,
        createNode,
        hookMap,
        provisionalNode
      });
    }
    else if (provisionalNode) {
      return createFinalTreeFromProvisionalNode({
        initialState,
        createNode,
        provisionalNode
      });
    }
  }

  return createInitialTree({
    initialState,
    pauser,
    hookMap,
    createNode,
    provisional,
    provisionalNode
  });
};

export default createTree;
