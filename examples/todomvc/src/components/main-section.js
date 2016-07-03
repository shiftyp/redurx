import React, { PropTypes } from 'react';

import TodoItem from './todo-item';
import Footer from './footer';
import filters from '../constants';

const MainSection = ({
  actions,
  filter,
  filteredTodos,
  counts
}) => {
  return (
    <section className='main'>
      <input
        className='toggle-all'
        type="checkbox"
        checked={counts.allCompleted}
        onChange={(e) => actions.completeAll(e.target.checked)}
      />
      <ul className='todo-list'>
        {filteredTodos.map(todo => (
          <TodoItem key={todo.id} todo={todo} actions={actions} />
        ))}
      </ul>
      <Footer
        {...counts}
        filter={filter}
        onClearCompleted={actions.clearCompleted}
        onFilter={actions.filterTodos}
      />
    </section>
  )
};

MainSection.propTypes = {
  actions: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  filteredTodos: PropTypes.array.isRequired,
  counts: PropTypes.object.isRequired
};

export default MainSection;
