const ws = require('ws')

const server = new ws.Server({ port: process.env.PORT || 8000 })

let subscriptions = {}

server.on('connection', socket => {
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
          lastObj[lastKey].subscribedClients = [socket]
        } else {
          const existingSubscribedClients = [
            ...lastObj[lastKey].subscribedClients
          ]
          existingSubscribedClients.push(socket)
          lastObj[lastKey].subscribedClients = existingSubscribedClients
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
