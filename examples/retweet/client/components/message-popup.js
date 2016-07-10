import React, { PropTypes } from 'react';

import Message from './message';

const hideHandler = hideMessages => e => {
  e.stopPropagation();
  hideMessages();
};

const MessagePopup = ({ list, shown, totalUnread, retrieveMessages, hideMessages }) => {
  if (shown) {
    const showMore = totalUnread > 0 ? (
      <a title="show more messages">Click To Show Unread Messages</a>
    ) : null;
    return (
      <ul
        className="message-popup"
        aria-live="polite"
        aria-relevant="additions">
        <div className="show-more">
          {showMore}
          <a title="close popup"><span
            onClick={hideHandler(hideMessages)}
            className="fa fa-remove"
            aria-hidden="true"></span></a>
        </div>
        {list.map(message => <Message message={message} />)}
      </ul>
    );
  } else {
    return null;
  }
};

MessagePopup.propTypes = {
  list: PropTypes.array.isRequired,
  shown: PropTypes.bool.isRequired,
  totalUnread: PropTypes.number.isRequired,
  retrieveMessages: PropTypes.func.isRequired,
  hideMessages: PropTypes.func.isRequired
};

export default MessagePopup;
