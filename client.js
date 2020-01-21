const EventEmitter = require('events')
const ws = require('ws')

class Client extends EventEmitter {
  constructor(address) {
    super()
    this.socket = new ws(address)

    this.socket.on('open', () => {
      this.emit('open')
    })

    this.socket.on('message', message => {
      this.emit('message', message)
    })
  }

  subscribe(topic) {
    this.socket.send(
      JSON.stringify({
        type: 'subscribe',
        timestamp: new Date(),
        topic: topic
      })
    )
  }

  unsubscribe(topic) {
    this.socket.send(
      JSON.stringify({
        type: 'unsubscribe',
        timestamp: new Date(),
        topic: topic
      })
    )
  }

  publish(topic, message) {
    this.socket.send(
      JSON.stringify({
        type: 'publish',
        timestamp: new Date(),
        topic: topic,
        message: message
      })
    )
  }
}

module.exports = Client
