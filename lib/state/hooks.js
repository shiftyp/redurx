import Rx from 'rx';

import { getObservable } from '../utils';
import { throwUndefinedNextStateError } from '../errors';

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
  return (actions) => {
    if (Array.isArray(actions)) {
      const observables = actions
        .map(getObservable)
        .map(wrapObservable);
      return Rx.Observable.combineLatest(
        ...observables
      );
    } else {
      return wrapObservable(getObservable(actions));
    }
  };
};

export const createReduce = (observable, nodeObservable, hookMap, pauser) => {
  const hookSubject = new Rx.ReplaySubject();
  const createHookObservable = createWrapHookObservable(hookMap, pauser)
  const connectReducer = (obs, setNextState, reducer) => {
    obs
      .subscribeOnNext(([vals, state]) => {
        const nextState = reducer(state, vals);
        if (typeof nextState === 'undefined') {
          throwUndefinedNextStateError();
        } else {
          setNextState(nextState);
        }
      })
  };

  const apiRealizationObservable = Rx.Observable
    .combineLatest(
      nodeObservable.filter(node => node && !node.provisional),
      hookSubject,
      ({ setNextState }, { hookObservable, reducer }) => {
        const nextSubject = new Rx.Subject();
        const nextObservable = nextSubject.withLatestFrom(observable);

        hookObservable.subscribe(nextSubject)
        connectReducer(nextObservable, setNextState, reducer)

        return true;
      }
    );

  apiRealizationObservable.subscribeOnError(error => { throw error });

  const reduce = (actions, reducer) => {
    const hookObservable = createHookObservable(actions);

    hookSubject.onNext({ hookObservable, reducer });
    return makeApi();
  };

  const makeApi = () => ({
    reduce: createReduce(
      observable,
      nodeObservable,
      hookMap,
      pauser
    )
  });

  return reduce;
};
