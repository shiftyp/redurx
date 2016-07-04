import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { filters, filterKeys } from '../constants';

const renderTodoCount = (activeCount) => {
  const itemWord = activeCount === 1 ? 'item' : 'items';

  return (
    <span className="todo-count">
      <strong>{activeCount || 'No'}</strong> {itemWord} left
    </span>
  );
}

const renderFilterItem = (filter, onFilter) => filterKey => {
  const filterTitle = filters[filterKey];
  const className = classnames({
    selected: filterTitle === filter
  });
  return (
    <li key={filterKey}>
      <a
        className={className}
        style={{ cursor: 'pointer' }}
        onClick={() => onFilter(filterTitle)}
      >
        {filterTitle}
      </a>
    </li>
  );
};

const Footer = ({
  completed,
  active,
  filter,
  onClearCompleted,
  onFilter
}) => {
  return (
    <footer className="footer">
      {renderTodoCount(active)}
      <ul className='filters'>
        {filterKeys.map(renderFilterItem(filter, onFilter))}
      </ul>
      <button
        className='clear-completed'
        onClick={onClearCompleted}
      >
        Clear completed
      </button>
    </footer>
  );
};

Footer.propTypes = {
  completedCount: PropTypes.number.isRequired,
  activeCount: PropTypes.number.isRequired,
  filter: PropTypes.string.isRequired,
  onClearCompleted: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired
};

export default Footer;
