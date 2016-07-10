const state = require('./state');

module.exports = (io) => {
  const tweetObs = state.initializeTweetObservable();
  let nextUserId = 0;

  tweetObs.subscribe(tweet => {
    io.emit('tweets', [tweet]);
  });

  io.on('connect', socket => {
    const userId = nextUserId++;
    const messageObs = state.initializeMessagesFor(userId);
    const messageSubscription = messageObs.subscribe(count => {
      socket.emit('message', count);
    });

    socket.on('disconnect', () => {
      state.deinitializeMessagesFor(userId);
      messageSubscription.dispose();
      console.log(`\uD83D\uDC64 User ${userId} disconnected`);
    });

    socket.emit('registered', userId);
    socket.emit('tweets', state.getAllTweets());

    console.log(`\uD83D\uDC64 User ${userId} connected`);
  })
  console.log('\uD83D\uDD0C Socket connected')
}
