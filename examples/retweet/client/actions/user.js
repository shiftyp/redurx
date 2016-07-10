import { createAction } from 'redurx';
import { initializeSocket } from './socket';

export const registered = createAction();

initializeSocket.asObservable().subscribe(io => {
  io.on('registered', registered);
});
