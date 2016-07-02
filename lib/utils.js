import Rx from 'rx';

export const isPlainObject = value => (
  isObject(value) && !isObservable(value)
);

export const isObject = value => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const isObservable = value => (
  value instanceof Rx.Observable || isSubject(value)
);

export const isSubject = value => (
  !![Rx.Subject, Rx.BehaviorSubject, Rx.ReplaySubject, Rx.AsyncSubject]
    .find(c => value instanceof c)
);

export const getObservable = value => {
  if (isObservable(value)) {
    return value;
  } else if (isObservable(value.observable)) {
    return value.observable;
  } else {
    throw new TypeError('Invalid Observable');
  }
};

export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
};
