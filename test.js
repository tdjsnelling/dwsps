const psclient = require('./client.js')

const ps = new psclient('http://localhost:8000')

ps.on('open', () => {
  ps.subscribe('news')
  ps.publish('news', 'Hello news channel.')
  ps.publish('news.uk', 'Hello news.uk channel.')
})

ps.on('message', message => {
  console.log(message)
})
