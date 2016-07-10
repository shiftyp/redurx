import React, { PropTypes } from 'react';

const Message = ({ message }) => {
  return (
    <li key={message.id} className="message">
      <img className="message-avatar" src={message.avatar} />
      <span className="message-name">{message.name}</span>
      <span className="message-text">{message.text}</span>
    </li>
  )
};

Message.propTypes = {
  message: PropTypes.object.isRequired
};

export default Message;
