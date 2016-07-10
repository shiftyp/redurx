const Rx = require('rx');
const faker = require('faker');

const userMessages = {};
let tweets = [];

const randomInterval = (min, max) => {
  return Math.floor(Math.random() * (1 + max - min)) + min;
};

const createRandomObservable = (min, max) => {
  return Rx.Observable.range(1, 4)
    .flatMap(() => {
      return Rx.Observable
        .interval(randomInterval(min, max))
    })
};

const createMessageObservable = (min, max) => {
  return createRandomObservable(min, max)
    .map((x) => {
      const tweet = {
        id: (Math.random() * 100000).toFixed(0),
        name: faker.name.findName(),
        avatar: faker.image.avatar(),
        text: faker.lorem.sentence()
      };
      return tweet;
    })
};

const initializeTweetObservable = () => {
  const tweetObs = createMessageObservable(3000, 15000);
  tweetObs.subscribe(tweet => {
    tweets = [tweet, ...tweets.slice(0, 11)]
  });
  return tweetObs;
};

const initializeMessagesFor = (userId) => {
  userMessages[userId] = {
    list: []
  };
  return createMessageObservable(10000, 20000)
    .doOnNext(message => {
      const messages = userMessages[userId];
      const { list } = messages;
      userMessages[userId] = Object.assign({}, messages, {
        list: [message, ...list.slice(0, 11)]
      })
    })
    .map(() => userMessages[userId].list.length);
};

const getMessagesFor = (userId) => {
  const list = userMessages[userId].list;
  userMessages[userId].list = [];
  return list;
};

const deinitializeMessagesFor = (userId) => {
  delete userMessages[userId];
};

const getAllTweets = () => {
  return tweets.slice();
};

module.exports = {
  initializeTweetObservable,
  initializeMessagesFor,
  deinitializeMessagesFor,
  getMessagesFor,
  getAllTweets
};
