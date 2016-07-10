import React, { PropTypes } from 'react';

import MessagesButton from './messages-button'

const Header = ({ tweets, retrieveMessages, hideMessages, messages }) => {
  return (
    <header className="pure-u-1">
      <div className="pure-u-1-2">
        <h1>
          <span className="blue">Re</span><span className="grey">Tweet</span>
        </h1>
      </div>
      <div className="pure-u-1-2">
        <MessagesButton
          retrieveMessages={retrieveMessages}
          hideMessages={hideMessages}
          messages={messages} />
        <h2 className="total-tweets">
          <span>Total Tweets Seen: {tweets.total}</span>
        </h2>
      </div>
    </header>
  );
}

Header.propTypes = {
  tweets: PropTypes.object.isRequired,
  messages: PropTypes.object.isRequired,
  retrieveMessages: PropTypes.func.isRequired,
  hideMessages: PropTypes.func.isRequired
};

export default Header;
