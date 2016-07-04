import state from './state';

import { addTodo, editNewTodo } from '../actions';

state('editor')
  .setInitialState({
    id: 1,
    text: '',
    editing: false
  })
  .hookReducers(addTodo)
    .next(({ id }) => ({
      id: id + 1,
      text: '',
      editing: false
    }))
  .hookReducers(editNewTodo)
    .next(({ id }, { text }) => {
      return {
        id,
        text: text,
        editing: true
      }
    });
