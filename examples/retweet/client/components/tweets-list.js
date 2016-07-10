import React, { PropTypes } from 'react';

import Tweet from './tweet';

const TweetsList = ({ tweets }) => {
  return (
    <main aria-live="polite" aria-relevant="additions">
      {tweets.list.map((tweet, i) => <Tweet key={`tweet-${i}`} {...tweet} />)}
    </main>
  )
};

TweetsList.propTypes = {
  tweets: PropTypes.object.isRequired
};

export default TweetsList;
