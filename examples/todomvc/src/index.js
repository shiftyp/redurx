import React from 'react';
import { render } from 'react-dom';
import setObservableConfig from 'recompose/setObservableConfig';
import mapPropsStream from 'recompose/mapPropsStream';
import rxjs4config from 'recompose/rxjs4ObservableConfig';
import 'todomvc-app-css/index.css';

import state from './state';
import App from './components/app';

const enhance = mapPropsStream(propsStream => {
  return propsStream
    .combineLatest(
      state.asObservable(),
      (props, { display, editor }) => ({
        display,
        editor
      })
    );
});

const EnhancedApp = enhance(App);

setObservableConfig(rxjs4config);

render(<EnhancedApp/>, document.getElementById('root'));
