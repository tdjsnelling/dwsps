const ws = require('ws')

const socket = new ws('ws://localhost:8000')

socket.on('open', () => {
  socket.send(
    JSON.stringify({
      type: 'subscribe',
      timestamp: new Date(),
      topic: 'news'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'subscribe',
      timestamp: new Date(),
      topic: 'news.uk'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'subscribe',
      timestamp: new Date(),
      topic: 'news.uk.london'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'subscribe',
      timestamp: new Date(),
      topic: 'news'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'unsubscribe',
      timestamp: new Date(),
      topic: 'news.uk.london'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'unsubscribe',
      timestamp: new Date(),
      topic: 'news.uk'
    })
  )
})
