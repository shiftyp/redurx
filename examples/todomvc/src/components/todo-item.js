import React, { PropTypes } from 'react';
import classnames from 'classnames';
import TodoTextInput from './todo-text-input';

const createElement = (todo, actions) => {
  if (todo.editing) {
    return <TodoTextInput
      todo={todo}
      onSave={actions.saveTodo}
      onEdit={actions.editTodo}
    />
  } else {
    return (
      <div className='view'>
        <input
          className='toggle'
          type='checkbox'
          checked={todo.completed}
          onChange={() => actions.completeTodo(Object.assign({}, todo, {
            completed: !todo.completed
          }))}
        />
        <label
          onDoubleClick={() => {
            actions.editTodo(todo);
          }}
        >
          {todo.text}
        </label>
        <button
          className='destroy'
          onClick={() => actions.deleteTodo(todo.id)}
        />
      </div>
    )
  }
}

const TodoItem = ({ todo, actions }) => {
  const { editing, completed } = todo
  const className = classnames({
    completed,
    editing
  });
  const element = createElement(
    todo,
    actions
  );
  return (
    <li className={className}>
      {element}
    </li>
  );
}

export default TodoItem;
