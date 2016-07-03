import React, { PropTypes } from 'react';
import TodoTextInput from './todo-text-input';

const Header = ({ addTodo, editNewTodo, editor }) => {
  return (
    <header className='header'>
      <h1>todos</h1>
      <TodoTextInput
        onSave={addTodo}
        onEdit={editNewTodo}
        isNew
        todo={editor}
        placeholder='What needs to be done?'
      />
    </header>
  )
};

Header.propTypes = {
  addTodo: PropTypes.func.isRequired,
  editNewTodo: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired
};

export default Header;
