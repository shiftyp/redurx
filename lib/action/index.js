import Rx from 'rx';

import { isObservable, getObservable } from '../utils.js'

const createObservable = (subject, cb) => {
  if (typeof cb === 'function') {
    return cb(subject.asObservable());
  } else {
    return subject.asObservable();
  }
};

export const createAction = (cb) => {
  const subject = new Rx.Subject();
  const observable = createObservable(subject, cb);
  if (!isObservable(observable)) {
    throw new Error('Action callback did not return an observble');
  }
  const action = (e) => {
    const nextVal = typeof e === 'undefined' ? null : e;
    subject.onNext(nextVal);
  };
  return Object.assign(action, { asObservable: () => observable });
};
