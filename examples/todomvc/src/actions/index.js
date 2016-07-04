import { createAction } from 'redurx';

export const addTodo = createAction(todo => {
  return todo.filter(({ text }) => text.length > 0)
});
export const filterTodos = createAction();
export const editNewTodo = createAction();
export const deleteTodo = createAction();
export const editTodo = createAction();
export const saveTodo = createAction(todo => {
  return todo
    .doOnNext(({ text, id, }) => {
      if (text === '') {
        deleteTodo(id);
      }
    })
    .filter(({ text }) => text !== '')
});
export const toggleCompleted = createAction(todo => {
  return todo.map(todo => Object.assign({}, todo, {
    completed: !todo.completed
  }))
})
export const completeAll = createAction();
export const clearCompleted = createAction();
