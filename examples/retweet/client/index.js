import React from 'react';
import { render } from 'react-dom';
import setObservableConfig from 'recompose/setObservableConfig';
import mapPropsStream from 'recompose/mapPropsStream';
import rxjs4config from 'recompose/rxjs4ObservableConfig';

setObservableConfig(rxjs4config);

import state from './state';
import {
  initializeSocket,
  retrieveMessages,
  hideMessages
} from './actions';
import App from './components/app';
import './css/main.css';

const enhance = mapPropsStream(propsStream => {
  return propsStream
    .combineLatest(
      state.asObservable(),
      (props, { tweets, messages }) => Object.assign({}, props, {
        tweets,
        messages
      })
    );
});

const EnhancedApp = enhance(App);

initializeSocket();

render(
  <EnhancedApp
    retrieveMessages={retrieveMessages}
    hideMessages={hideMessages}
  />,
  document.getElementById('root')
);
