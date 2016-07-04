import state from './state';
import {
  addTodo,
  deleteTodo,
  editTodo,
  toggleCompleted,
  completeAll,
  saveTodo,
  clearCompleted
} from '../actions';

const updateTodo = (id, props) => todo => {
  if (id === null || todo.id === id) {
    return Object.assign({}, todo, props);
  } else {
    return todo;
  }
};

state('todos')
  .setInitialState([{
    id: 0,
    text: 'Learn ReduRx!',
    editing: false,
    completed: false
  }])
  .hookReducers(addTodo)
    .next((todos, { id, text }) => (
      [
        {
          id,
          text,
          editing: false,
          completed: false,
        },
        ...todos
      ]
    ))
  .hookReducers(deleteTodo)
    .next((todos, id) => (
      todos.filter(todo => todo.id !== id)
    ))
  .hookReducers(editTodo)
    .next((todos, { id, text }) => (
      todos.map(updateTodo(id, { text, editing: true }))
    ))
  .hookReducers(saveTodo)
    .next((todos, { id, completed, text }) => (
      todos.map(updateTodo(id, { completed, text, editing: false }))
    ))
  .hookReducers(toggleCompleted)
    .next((todos, { id, completed }) => (
      todos.map(updateTodo(id, { completed }))
    ))
  .hookReducers(completeAll)
    .next((todos, completed) => (
      todos.map(updateTodo(null, { completed }))
    ))
  .hookReducers(clearCompleted)
    .next((todos) => todos.filter(todo => !todo.completed));
