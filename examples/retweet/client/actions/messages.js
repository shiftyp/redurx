import axios from 'axios';
import { createAction } from 'redurx';

import state from '../state/state';
import { initializeSocket } from './socket';

export const messageRecieved = createAction();
export const showMessages = createAction();
export const hideMessages = createAction();

export const retrieveMessages = createAction(req => {
  return req
    .withLatestFrom(state('messages.totalUnread').asObservable(), (_, total) => total)
    .filter(total => total > 0)
    .withLatestFrom(state('user.id').asObservable(), (_, id) => id)
    .flatMapLatest((userId) => {
      return axios.get(`/api/messages/${userId}`)
        .then(res => res.data)
        .catch(err => {
          console.log(err);
          return [];
        });
    })
    .doOnNext(() => showMessages());
});

initializeSocket.asObservable().subscribe(io => {
  io.on('message', messageRecieved);
});
