const ws = require('ws')

const socket = new ws('ws://localhost:8000')

socket.on('message', message => {
  console.log(message)
})

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
      type: 'publish',
      timestamp: new Date(),
      topic: 'news',
      message: 'Hello, world!'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'unsubscribe',
      timestamp: new Date(),
      topic: 'news'
    })
  )

  socket.send(
    JSON.stringify({
      type: 'publish',
      timestamp: new Date(),
      topic: 'news',
      message: 'Hello, world! -- again'
    })
  )
})
