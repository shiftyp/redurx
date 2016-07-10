import io from 'socket.io-client';
import { createAction } from 'redurx';

export const initializeSocket = createAction(init => {
  return init
    .take(1)
    .map(() => io())
    .share();
});
