import Rx from 'rx';

import { createTree } from './tree';
import { getObservable, pick } from '../utils';
import { throwFinalizedError, throwChildrenError } from '../errors';

const exposedNodeProps = ['hookReducers', 'asObservable', 'setInitialState'];

export const createWrapHookObservable = (map, pauser) => {
  const wrapObservable = (observable) => {
    const memo = map.get(observable);
    if (memo) return memo;
    const mapTmpObserver = method => val => {

    };
    const wrapped = observable
      .doOnNext(() => pauser.onNext(false))
      .doOnError(() => pauser.onNext(false))
      .flatMapObserver(
        val => {
          return Rx.Observable
            .just(val)
            .doOnCompleted(() => pauser.onNext(true));
        },
        err => {
          return Rx.Observable.create((o) => {
            o.onError(err);
            pauser.onNext(true);
          })
        }
      )
      .startWith(null)
      .share();
    map.set(observable, wrapped);
    return wrapped;
  }
  return (action, additionalActionsOrObservables) => {
    const actionObservable = getObservable(action);
    if (additionalActionsOrObservables.length) {
      const observables = [
        actionObservable,
        ...additionalActionsOrObservables.map(getObservable)
      ].map(wrapObservable);
      return Rx.Observable.combineLatest(
        ...observables
      );
    } else {
      return wrapObservable(actionObservable);
    }
  };
};

export const createHookReducers = (observable, nodeObservable, hookMap, pauser) => {
  const allDisposable = new Rx.CompositeDisposable();
  const hookSubject = new Rx.ReplaySubject();
  const nextHandlerSubject = new Rx.ReplaySubject();
  const errorHandlerSubject = new Rx.ReplaySubject();
  const createHookObservable = createWrapHookObservable(hookMap, pauser)
  const createReduce = (obs, setNextState, filter) => handler => {
    allDisposable.add(
      obs
        .filter(([vals, state, type]) => type === filter)
        .subscribeOnNext(([vals, state, type]) => {
          if (Array.isArray(vals)) {
            setNextState(handler(state, ...vals))
          } else {
            setNextState(handler(state, vals));
          }
        })
    );
  };
  const apiRealizationObservable = Rx.Observable
    .combineLatest(
      nodeObservable.filter(node => node && !node.provisional),
      hookSubject,
      ({ setNextState }, hookObservable) => {
        const nextSubject = new Rx.Subject();
        const errorSubject = new Rx.Subject();
        const errorObservable = errorSubject
          .withLatestFrom(observable, Rx.Observable.just('E'));
        const nextObservable = nextSubject
          .withLatestFrom(observable, Rx.Observable.just('N'))
          .doOnError((err) => errorSubject.onNext(err))
          .onErrorResumeNext(errorObservable);

        allDisposable.add(
          hookObservable
            .subscribe(nextSubject)
        );

        nextHandlerSubject.subscribe(
          createReduce(nextObservable, setNextState, 'N')
        );
        errorHandlerSubject.subscribe(
          createReduce(errorObservable, setNextState, 'E')
        );
        return true;
      }
    );

  apiRealizationObservable.subscribeOnError(error => { throw error });

  const dispose = () => {
    allDisposable.dispose();
    return api;
  };

  const next = handler => {
    nextHandlerSubject.onNext(handler);
    return makeApi();
  };
  const error = handler => {
    errorHandlerSubject.onNext(handler);
    return makeApi();
  };

  const hookReducers = (action, ...additionalActionsOrObservables) => {
    const hookObservable = createHookObservable(
      action,
      additionalActionsOrObservables
    );

    hookSubject.onNext(hookObservable);
    return makeApi();
  };

  const makeApi = () => ({
    next,
    error,
    dispose,
    hookReducers: createHookReducers(
      observable,
      nodeObservable,
      hookMap,
      pauser
    )
  });

  return hookReducers;
};

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
        addChildrenSubject.onNext({ key, value });
      } else {
        addChildrenSubject.onNext({ key, value: null, provisional: true});
      }
    }
    return getChildrenSubject.getValue()[key].nodeSubject.getValue();
  };
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
  let child;
  let nodeSubject;
  let observableSubject;
  let asObservable;
  let hookReducers;
  if (provisionalNode) {
    pauser = provisionalNode.pauser,
    hookMap = provisionalNode.hookMap,
    setNextState = setNextState || provisionalNode.setNextState;
    addChildrenSubject = provisionalNode.addChildrenSubject,
    getChildrenSubject = provisionalNode.getChildrenSubject;
    child = provisionalNode.child;
    nodeSubject = provisionalNode.nodeSubject;
    asObservable = provisionalNode.asObservable;
    observableSubject = provisionalNode.observableSubject;
    hookReducers = provisionalNode.hookReducers;
  } else {
    observableSubject = new Rx.ReplaySubject(1);
    // Great name right?
    const observableObservable = observableSubject
      .flatMapLatest(obs => obs);
    child = createChildAccessor(addChildrenSubject, getChildrenSubject);
    nodeSubject = new Rx.BehaviorSubject();
    asObservable = () => observableObservable;
    hookReducers = createHookReducers(
      asObservable(),
      nodeSubject.asObservable(),
      hookMap,
      pauser
    );

  }

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
    provisionalNode: provisionalNode,
    pauser,
    observableSubject,
    asObservable,
    setInitialState: (initialState) => {
      if (!provisional) {
        throwFinalizedError();
      } else {
        createTree({
          initialState,
          createNode,
          provisional: false,
          provisionalNode: provisionalNode || node
        });
      }
    }
  };
  const node = Object.assign(
    createNodeAccessor(nodeProps),
    nodeProps
  );

  nodeSubject.onNext(node);

  return node;
};

export const publishNode = node => Object.assign(function() {
  return node.apply(null, arguments);
}, pick(node, exposedNodeProps));
