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
        console.log(`Subscribe to ${message.topic} by ${clientAddress}`)

        const keys = message.topic.split('.')
        const lastKey = keys.pop()
        const lastObj = keys.reduce(
          (obj, key) => (obj[key] = obj[key] || {}),
          subscriptions
        )

        // create an empty object if it doesn't already exist
        if (!lastObj[lastKey]) lastObj[lastKey] = {}

        // if there is no subscribed clients object, create one and add this client
        // else just add this client to the list
        if (!lastObj[lastKey].subscribedClients) {
          lastObj[lastKey].subscribedClients = { [clientAddress]: socket }
        } else {
          lastObj[lastKey].subscribedClients = {
            ...lastObj[lastKey].subscribedClients,
            [clientAddress]: socket
          }
        }
        break
      }
      case 'unsubscribe': {
        console.log(`Unsubscribe from ${message.topic} by ${clientAddress}`)

        const keys = message.topic.split('.')
        const lastKey = keys.pop()
        const lastObj = keys.reduce(
          (obj, key) => (obj[key] = obj[key] || {}),
          subscriptions
        )

        // if this client is in the list of subscribed clients for this topic, delete it
        if (lastObj[lastKey].subscribedClients[clientAddress]) {
          delete lastObj[lastKey].subscribedClients[clientAddress]
        }
        break
      }
      case 'publish': {
        console.log(`Publish to ${message.topic} from ${clientAddress}`)

        const keys = message.topic.split('.')
        const lastKey = keys.pop()
        const lastObj = keys.reduce(
          (obj, key) => (obj[key] = obj[key] || {}),
          subscriptions
        )

        const subscribedClients = lastObj[lastKey]
          ? lastObj[lastKey].subscribedClients
          : {}

        Object.keys(subscribedClients).map(client => {
          subscribedClients[client].send(JSON.stringify(message))
        })
        break
      }
      default: {
        // do nothing
      }
    }
  })
})
