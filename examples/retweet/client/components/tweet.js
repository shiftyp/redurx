import React, { PropTypes } from 'react';

const Tweet = ({ avatar, name, text, id }) => {
  return (
    <div key={id} className="pure-u-1-4">
      <div className="pure-u-1">
        <img src={avatar} />
      </div>
      <div className="pure-u-1">
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
};

Tweet.propTypes = {
  avatar: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};

export default Tweet;
