import Rx from 'rx';
import snabbdom from 'snabbdom';
import eventlisteners from 'snabbdom/modules/eventlisteners';
import klass from 'snabbdom/modules/class';
import props from 'snabbdom/modules/props';
import attrs from 'snabbdom/modules/attributes';
import h from 'snabbdom/h';
import { createComponentStream } from 'snabbdom-rx-utils';
import createRouter from 'observable-router';

import state from './state';
import { selectItem } from './actions';

import AppContainer from './containers/app-container';
import HomeContainer from './containers/home-container';
import ItemsContainer from './containers/items-container';
import ItemContainer from './containers/item-container';

const patch = snabbdom.init([eventlisteners, klass, props, attrs]);

const AppStream = createComponentStream(null, AppContainer);
const HomeStream = createComponentStream(null, HomeContainer);
const ItemsStream = createComponentStream(
  state.compose({ list: 'list' }),
  ItemsContainer
);
const ItemStream = createComponentStream(
  state.compose({ item: 'selected' }),
  ItemContainer
);

const router = createRouter();

const vdomObservable = router
  .route('/', (route, history, children) => (
    AppStream({ history }, children)
  ), sub => sub
    .route('/', (route) => HomeStream())
    .route('/items', {}, sub => sub
      .route('/', (route, history) => ItemsStream({ history }))
      .route('/:id', {
        stream: (route) => ItemStream(),
        onNext: (route) => selectItem(route.params.id)
      })
    )
  )
  .asObservable()
  .scan(patch, document.getElementById('root'));

vdomObservable.subscribeOnError(err => {
  console.log('Rendering Error:', err.stack);
});

router.start();
