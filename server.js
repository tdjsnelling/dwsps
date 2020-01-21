const ws = require('ws')

const server = new ws.Server({ port: process.env.PORT || 8000 })

let subscriptions = {}

server.on('connection', (socket, req) => {
  const clientAddress = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0]
    : req.connection.remoteAddress

  socket.on('message', m => {
    const message = JSON.parse(m)

    switch (message.type) {
      case 'subscribe': {
        const keys = message.topic.split('.')
        const lastKey = keys.pop()
        const lastObj = keys.reduce(
          (obj, key) => (obj[key] = obj[key] || {}),
          subscriptions
        )

        lastObj[lastKey] = lastObj[lastKey] ? { ...lastObj[lastKey] } : {}

        if (!lastObj[lastKey].subscribedClients) {
          lastObj[lastKey].subscribedClients = { [clientAddress]: socket }
        } else {
          lastObj[lastKey].subscribedClients = {
            ...lastObj[lastKey].subscribedClients,
            [clientAddress]: socket
          }
        }

        console.log(subscriptions)
        break
      }
      case 'unsubscribe': {
        break
      }
      case 'publish': {
        break
      }
      default: {
        // do nothing
      }
    }
  })
})
