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
  .reduce(addTodo, (todos, { id, text }) => (
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
  .reduce(deleteTodo, (todos, id) => (
    todos.filter(todo => todo.id !== id)
  ))
  .reduce(editTodo, (todos, { id, text }) => (
    todos.map(updateTodo(id, { text, editing: true }))
  ))
  .reduce(saveTodo, (todos, { id, completed, text }) => (
    todos.map(updateTodo(id, { completed, text, editing: false }))
  ))
  .reduce(toggleCompleted, (todos, { id, completed }) => (
    todos.map(updateTodo(id, { completed }))
  ))
  .reduce(completeAll, (todos, completed) => (
    todos.map(updateTodo(null, { completed }))
  ))
  .reduce(clearCompleted, (todos) => (
    todos.filter(todo => !todo.completed)
  ));
