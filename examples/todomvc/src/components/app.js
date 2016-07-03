import React, { PropTypes } from 'react';

import * as actions from '../actions';

import Header from '../components/header';
import MainSection from '../components/main-section';

const App = ({ editor, display }) => {
  return (
    <div>
      <Header
        addTodo={actions.addTodo}
        editNewTodo={actions.editNewTodo}
        editor={editor}
      />
      <MainSection
        {...display}
        actions={actions}
      />
    </div>
  );
};

App.propTypes = {
  display: PropTypes.object.isRequired,
  editor: PropTypes.object.isRequired
};

export default App;
