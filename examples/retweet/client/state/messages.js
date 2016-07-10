import state from './state';
import {
  messageRecieved,
  retrieveMessages,
  showMessages,
  hideMessages
} from '../actions';

const messages = state('messages', {
  shown: false,
  list: [],
  totalUnread: 0
});

messages('totalUnread')
  .reduce(messageRecieved, (state, total) => total)
  .reduce(retrieveMessages, (state, list) => state - list.length);

messages('list')
  .reduce(retrieveMessages, (state, list) => [...list, ...state])
  .reduce(hideMessages, () => []);

messages('shown')
  .reduce(showMessages, () => true)
  .reduce(hideMessages, () => false);
