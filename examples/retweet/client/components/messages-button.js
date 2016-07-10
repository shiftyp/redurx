import React, { PropTypes } from 'react';

import MessagePopup from './message-popup';

const MessagesButton = ({ retrieveMessages, hideMessages, messages }) => {
  return (
    <button
      aria-haspopup="true"
      className="pure-button pure-button-primary messages-button"
      onClick={retrieveMessages}>
      <i className="fa fa-envelope" aria-hidden="true"></i>
      {` Messages`} {messages.totalUnread}
      <MessagePopup
        retrieveMessages={retrieveMessages}
        hideMessages={hideMessages}
        {...messages}/>
    </button>
  )
};

MessagesButton.propTypes = {
  retrieveMessages: PropTypes.func.isRequired,
  hideMessages: PropTypes.func.isRequired,
  messages: PropTypes.object.isRequired
};

export default MessagesButton;
