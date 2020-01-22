const EventEmitter = require('events')
const ws = require('ws')

class Server extends EventEmitter {
  constructor(opts) {
    super()
    const server = new ws.Server({ port: opts.port || 8000 })

    let peers = {}
    let subscriptions = {}

    if (opts.peers) {
      opts.peers.map(peer => {
        peers[peer] = new ws(peer)
      })
    }

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

        // if a message is organic (not from a peer server) and of the publish
        // type, then forward it to all peer servers, with the `fromPeerServer`
        // flag
        if (!message.fromPeerServer && message.type === 'publish') {
          Object.keys(peers).map(peer => {
            peers[peer].send(
              JSON.stringify({
                ...message,
                fromPeerServer: true
              })
            )
          })
        }

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

            socket.send(
              JSON.stringify({
                type: 'ack',
                action: 'subscribe',
                timestamp: new Date(),
                topic: message.topic
              })
            )

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

            socket.send(
              JSON.stringify({
                type: 'ack',
                action: 'unsubscribe',
                timestamp: new Date(),
                topic: message.topic
              })
            )

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

            socket.send(
              JSON.stringify({
                type: 'ack',
                action: 'publish',
                timestamp: new Date(),
                topic: message.topic
              })
            )

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
