import state from './state';
import { tweetsRecieved } from '../actions';

const tweets = state('tweets', {
  list: [],
  total: 0
});

tweets('list')
  .reduce(tweetsRecieved, (state, tweets) => (
    [...tweets, ...state.slice(0, 11)]
  ));

tweets('total')
  .reduce(tweetsRecieved, (state, tweets) => state + tweets.length);
