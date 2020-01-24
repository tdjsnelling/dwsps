const EventEmitter = require('events')
const ws = require('ws')

class Server extends EventEmitter {
  constructor(opts) {
    super()
    const server = new ws.Server({ port: opts.port || 8000 })

    let peers = {}

    // open sockets with all peer servers
    if (opts.peers) {
      opts.peers.map(peer => {
        peers[peer] = new ws(peer)
      })
    }

    // ping every client at 10 second intervals, terminate them if they do not
    // respond
    setInterval(() => {
      server.clients.forEach(socket => {
        if (socket.isAlive === false) socket.terminate()
        socket.isAlive = false
        socket.ping()
      })
    }, 10000)

    server.on('connection', (socket, req) => {
      const clientId = req.headers['sec-websocket-key']

      // set some client defaults
      socket.id = clientId
      socket.isAlive = true
      socket.subscriptions = []
      socket.on('pong', () => {
        this.isAlive = true
      })

      socket.on('message', message => {
        message = JSON.parse(message)

        switch (message.type) {
          case 'subscribe': {
            this.emit('subscribe', message.topic, clientId)

            // add this topic to the list of client subscriptions if it is not
            // there already
            const existingSubscriptions = [...socket.subscriptions]
            if (!(message.topic in existingSubscriptions)) {
              existingSubscriptions.push(message.topic)
              socket.subscriptions = existingSubscriptions
            }

            // send a subscribe acknowledgement message
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
            this.emit('unsubscribe', message.topic, clientId)

            // remove this topic from the list of client subscriptions
            if (socket.subscriptions) {
              const existingSubscriptions = [...socket.subscriptions]
              const index = existingSubscriptions.indexOf(message.topic)

              if (index) {
                existingSubscriptions.splice(index, 1)
                socket.subscriptions = existingSubscriptions
              }
            }

            // send an unsubscribe acknowledgement message
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
            this.emit('publish', message.topic, clientId)

            const topics = message.topic.split('.')

            let allSubscribers = {}

            // get a list of all subscribers to a topic, including parent topics
            // e.g. a subscriber of `news` also needs receive messages from
            // `news.uk` and `news.uk.london` etc.
            for (let i = topics.length; i >= 1; i--) {
              const topicString = topics.slice(0, i).join('.')
              const topicSubscribers = [...server.clients].filter(client => {
                return client.subscriptions.includes(topicString)
              })
              allSubscribers[topicString] = topicSubscribers
            }

            // forward the published messaged. the receiver may not by
            // explicitly subscribed to `message.topic` so add a `context` to
            // tell them which subscription caused them to receive the message
            Object.keys(allSubscribers).map(topic => {
              Object.keys(allSubscribers[topic]).map(client => {
                allSubscribers[topic][client].send(
                  JSON.stringify({ ...message, context: topic })
                )
              })
            })

            // if a message is organic (not from a peer server) then forward it
            // to all peer servers, with the `fromPeerServer` flag
            if (!message.fromPeerServer) {
              Object.keys(peers).map(peer => {
                peers[peer].send(
                  JSON.stringify({
                    ...message,
                    fromPeerServer: true
                  })
                )
              })
            }

            // send a publish acknowledgement message
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
          default:
        }
      })
    })
  }
}

module.exports = Server
