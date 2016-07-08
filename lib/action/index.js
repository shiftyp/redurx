import Rx from 'rx';

import { isObservable, getObservable } from '../utils';
import { throwActionObservableError } from '../errors';

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
    throwActionObservableError();
  }
  const action = (e) => {
    const nextVal = typeof e === 'undefined' ? null : e;
    subject.onNext(nextVal);
  };
  return Object.assign(action, { asObservable: () => observable });
};
