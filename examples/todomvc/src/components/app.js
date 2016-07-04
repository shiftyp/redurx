import React, { PropTypes } from 'react';

import * as actions from '../actions';

import Header from '../components/header';
import MainSection from '../components/main-section';

const createMainSection = (display) => {
  if (display.counts.total > 0) {
    return (
      <MainSection
        {...display}
        actions={actions}
      />
    );
  } else {
    return null;
  }
}

const App = ({ editor, display }) => {
  return (
    <div>
      <Header
        addTodo={actions.addTodo}
        editNewTodo={actions.editNewTodo}
        editor={editor}
      />
      {createMainSection(display)}
    </div>
  );
};

App.propTypes = {
  display: PropTypes.object.isRequired,
  editor: PropTypes.object.isRequired
};

export default App;
