const psServer = require('./server')
const psClient = require('./client')

const server = new psServer(8000)

server.on('subscribe', (topic, client) => {
  console.log(topic, client)
})

const client = new psClient('http://localhost:8000')

client.on('open', () => {
  client.subscribe('news')
  client.publish('news', 'Hello news channel.')
  client.publish('news.uk', 'Hello news.uk channel.')
})

client.on('message', message => {
  console.log(message)
})
