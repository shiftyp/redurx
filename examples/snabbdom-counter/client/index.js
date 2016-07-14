import snabbdom from 'snabbdom';
import eventlisteners from 'snabbdom/modules/eventlisteners';
import { createState, createAction } from 'redurx';
import h from 'snabbdom/h';

const patch = snabbdom.init([eventlisteners]);

const state = createstate({ counter: 0 });

const increment = createAction();
const decrement = createAction();

state('counter')
  .reduce(increment, num => num + 1)
  .reduce(decrement, num => num - 1);

const render = (counter) => (
  <div>
    <div>{counter}</div>
    <button on-click={increment}>Increment</button>
    <button on-click={decrement}>Decrement</button>
  </div>
);

const vdom = state('counter')
  .asObservable()
  .map(render)
  .scan(patch, document.getElementById('root'));

vdom.subscribeOnError(err => console.error('Rendering Error:', err.stack));

state.connect();
