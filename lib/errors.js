export const throwShapeError = () => {
  throw new Error('Changes to state shape are not supported.');
};

export const throwChildrenError = () => {
  throw new Error('Attempted to get or set children on a non-object');
};

export const throwFinalizedError = (key) => {
  throw new Error(`Attempting to set new value on final node ${key}`);
};

export const throwActionObservableError = () => {
  throw new Error('Action callback did not return an observable');
};

export const throwUndefinedNextStateError = () => {
  throw new Error('Reducer returned undefined for next state');
};
