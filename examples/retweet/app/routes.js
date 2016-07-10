const { Router } = require('express');
const router = Router();

const state = require('./state');

router.get('/api/messages/:id', (req, res) => {
  const messages = state.getMessagesFor(req.params.id);
  res.json(messages || []);
});

module.exports = router;
