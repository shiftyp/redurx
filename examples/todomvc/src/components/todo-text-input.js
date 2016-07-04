import React, { PropTypes } from 'react';
import classnames from 'classnames';

const handleBlur = (todo, onSave) => e => {
  onSave({
    id: todo.id,
    text: e.target.value
  });
};
const handleChange = (todo, onEdit) => e => {
  onEdit({
    id: todo.id,
    text: e.target.value
  });
};
const handleKeyDown = (todo, onEdit, onSave) => e => {
  const text = e.target.value.trim();
  if (e.which === 13) {
    onSave({
      id: todo.id,
      text
    });
  } else {
    onEdit({
      id: todo.id,
      text
    });
  }
};
const getClassName = (isNew, todo) => classnames({
  edit: todo.editing,
  'new-todo': isNew
});

const TodoTextInput = ({
    onSave,
    onEdit,
    todo,
    isNew,
    placeholder
  }) => {
  return (
    <input
      className={getClassName(!!isNew, todo)}
      type='text'
      placeholder={placeholder}
      autofocus
      value={todo.text}
      onBlur={handleBlur(todo, onSave)}
      onChange={handleChange(todo, onEdit)}
      onKeyDown={handleKeyDown(todo, onEdit, onSave)}
    />
  )
};

TodoTextInput.propTypes = {
  onSave: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  placeholder: PropTypes.string.isRequired
};

export default TodoTextInput;
