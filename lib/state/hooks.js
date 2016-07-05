import Rx from 'rx';

import { getObservable } from '../utils';

const createWrapHookObservable = (map, pauser) => {
  const wrapObservable = (observable) => {
    const memo = map.get(observable);
    if (memo) return memo;
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
        .subscribeOnNext(([vals, state]) => {
          setNextState(handler(state, vals));
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

  const makeApi = (() => {
    let memo = null;
    return () => {
      if (memo) {
        return memo;
      } else {
        return memo = {
          next,
          error,
          dispose,
          hookReducers: createHookReducers(
            observable,
            nodeObservable,
            hookMap,
            pauser
          )
        };
      }
    }
  })();

  return hookReducers;
};
