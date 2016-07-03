import { createState } from 'redurx';
import Rx from 'rx';

import {
  addTodo,
  deleteTodo,
  editNewTodo,
  editTodo,
  completeTodo,
  completeAll,
  filterTodos,
  saveTodo,
  clearCompleted
} from '../actions';
import { filters } from '../constants';

const state = createState({
  todos: [{
    text: 'Learn ReduRx!',
    completed: false,
    id: 0,
    editing: false
  }],
  editor: {
    id: 1,
    text: '',
    editing: false
  },
  display: {
    filter: filters.SHOW_ALL,
    filteredTodos: null,
    counts: {
      completed: null,
      active: null,
      allCompleted: null
    }
  }
});

const updateTodo = (id, props) => todo => {
  if (id === null || todo.id === id) {
    return Object.assign({}, todo, props);
  } else {
    return todo;
  }
};

const createFilteredTodos = filter => todo => {
  switch(filter) {
    case filters.SHOW_ACTIVE:
      return !todo.completed;
    case filters.SHOW_COMPLETED:
      return todo.completed;
    default:
      return true;
  }
};

state('display.filteredTodos')
  .hookReducers(
    state('todos').asObservable(),
    state('display.filter').asObservable()
  )
    .next((filtered, [todos, filter]) => (
      todos.filter(createFilteredTodos(filter))
    ));

state('display.counts')
  .hookReducers(state('todos').asObservable())
    .next((counts, todos) => {
      const completedCount = todos.reduce((count, todo) => (
        todo.completed ? count + 1 : count
      ), 0);
      return {
        completed: completedCount,
        active: todos.length - completedCount,
        allCompleted: completedCount === todos.length
      };
    })

state('todos')
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
    )
  )
  .hookReducers(deleteTodo)
    .next((todos, id) => (
      todos.filter(todo => todo.id !== id)
    ))
  .hookReducers(editTodo)
    .next((todos, { id, text }) => (
      todos.map(updateTodo(id, { text, editing: true }))
    )
  )
  .hookReducers(saveTodo)
    .next((todos, { id, completed, text }) => (
      todos.map(updateTodo(id, { completed, text, editing: false }))
    )
  )
  .hookReducers(completeTodo)
    .next((todos, { id, completed }) => (
      todos.map(updateTodo(id, { completed }))
    )
  )
  .hookReducers(completeAll)
    .next((todos, completed) => (
      todos.map(updateTodo(null, { completed }))
    )
  )
  .hookReducers(clearCompleted)
    .next((todos) => todos.filter(todo => !todo.completed));

state('display.filter')
  .hookReducers(filterTodos)
    .next((state, filter) => filter);

state('editor')
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

state.connect();

export default state;
