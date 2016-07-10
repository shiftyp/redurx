import { createAction } from 'redurx';
import { initializeSocket } from './socket';

export const tweetsRecieved = createAction();

initializeSocket.asObservable().subscribe(io => {
  io.on('tweets', tweetsRecieved);
});
