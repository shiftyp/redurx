import state from './state';
import { registered } from '../actions';

const user = state('user');

state('user', {
  id: 0
});

user('id').reduce(registered, (state, id) => id);
