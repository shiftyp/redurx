import React, { PropTypes } from 'react';

import Header from './header';
import TweetsList from './tweets-list';

const App = ({ tweets, messages, retrieveMessages, hideMessages }) => {
  return (
    <div className="pure-g">
      <Header
        retrieveMessages={retrieveMessages}
        hideMessages={hideMessages}
        messages={messages}
        tweets={tweets}
      />
      <TweetsList tweets={tweets} />
    </div>
  )
};

App.propTypes = {
  tweets: PropTypes.object.isRequired,
  messages: PropTypes.object.isRequired,
  retrieveMessages: PropTypes.func.isRequired,
  hideMessages: PropTypes.func.isRequired
};

export default App;
