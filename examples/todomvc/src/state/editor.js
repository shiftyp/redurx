import state from './state';

import { addTodo, editNewTodo } from '../actions';

state('editor')
  .setInitialState({
    id: 1,
    text: '',
    editing: false
  })
  .reduce(addTodo, ({ id }) => ({
      id: id + 1,
      text: '',
      editing: false
  }))
  .reduce(editNewTodo, ({ id }, { text }) => {
    return {
      id,
      text: text,
      editing: true
    }
  });
