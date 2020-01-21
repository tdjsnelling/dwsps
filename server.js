const EventEmitter = require('events')
const ws = require('ws')

class Server extends EventEmitter {
  constructor(port) {
    super()
    const server = new ws.Server({ port: port || 8000 })

    let subscriptions = {}

    const getTopicSubscribers = topic => {
      const keys = topic.split('.')
      const lastKey = keys.pop()
      const lastObj = keys.reduce(
        (obj, key) => (obj[key] = obj[key] || {}),
        subscriptions
      )
      return lastObj[lastKey] ? lastObj[lastKey].subscribedClients : {}
    }

    server.on('connection', (socket, req) => {
      const clientAddress = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0]
        : req.connection.remoteAddress

      socket.on('message', m => {
        const message = JSON.parse(m)

        switch (message.type) {
          case 'subscribe': {
            this.emit('subscribe', message.topic, clientAddress)

            const keys = message.topic.split('.')
            const lastKey = keys.pop()
            const lastObj = keys.reduce(
              (obj, key) => (obj[key] = obj[key] || { subscribedClients: {} }),
              subscriptions
            )

            // create an empty object if it doesn't already exist
            if (!lastObj[lastKey]) lastObj[lastKey] = {}

            // if there is no subscribed clients object, create one and add this
            // client. else just add this client to the list
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
            this.emit('unsubscribe', message.topic, clientAddress)

            const keys = message.topic.split('.')
            const lastKey = keys.pop()
            const lastObj = keys.reduce(
              (obj, key) => (obj[key] = obj[key] || {}),
              subscriptions
            )

            // if this client is in the list of subscribed clients for this topic,
            // delete it
            if (lastObj[lastKey].subscribedClients[clientAddress]) {
              delete lastObj[lastKey].subscribedClients[clientAddress]
            }
            break
          }
          case 'publish': {
            this.emit('publish', message.topic, clientAddress)

            const topics = message.topic.split('.')

            let allSubscribers = {}

            // get a list of all subscribers to a topic, including parent topics
            // e.g. a subscriber of `news` also needs receive messages from
            // `news.uk` and `news.uk.london` etc.
            for (let i = topics.length; i >= 1; i--) {
              const topicString = topics.slice(0, i).join('.')
              const topicSubscribers = getTopicSubscribers(topicString)
              allSubscribers[topicString] = topicSubscribers
            }

            // forward the published messaged. the receiver may not by explicitly
            // subscribed to `message.topic` so add a `context` to tell them which
            // subscription caused them to receive the message
            Object.keys(allSubscribers).map(topic => {
              Object.keys(allSubscribers[topic]).map(client => {
                allSubscribers[topic][client].send(
                  JSON.stringify({ ...message, context: topic })
                )
              })
            })
            break
          }
          default: {
            // do nothing
          }
        }
      })
    })
  }
}

module.exports = Server
