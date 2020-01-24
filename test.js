/* eslint-disable no-undef */
const PSServer = require('./server')
const PSClient = require('./client')

process.env.NODE_ENV = 'test'

let serverA, serverB, clientA, clientB

describe('dwsps', () => {
  before(done => {
    serverA = new PSServer({ port: 8000, peers: ['ws://localhost:8001'] })
    serverB = new PSServer({ port: 8001, peers: ['ws://localhost:8000'] })

    clientA = new PSClient('ws://localhost:8000')
    clientB = new PSClient('ws://localhost:8001')

    done()
  })

  describe('server', () => {
    describe('events', () => {
      it('should emit a subscribe event', done => {
        clientA.subscribe('topic')
        serverA.on('subscribe', () => done())
      })
      it('should emit a publish event', done => {
        clientA.publish('topic', 'Hello world')
        serverA.on('publish', () => done())
      })
      it('should emit an unsubscribe event', done => {
        clientA.unsubscribe('topic')
        serverA.on('unsubscribe', () => done())
      })
      after(() => {
        serverA.removeAllListeners()
      })
    })

    describe('peering', () => {
      it('server B should receive a message published to server A', done => {
        clientA.publish('topic', 'Hello world')
        serverB.on('publish', () => done())
      })
    })
    after(() => {
      serverB.removeAllListeners()
    })
  })

  describe('client', () => {
    describe('acknowledgements', () => {
      it('should receive acknowledgement for subscribing', done => {
        clientA.subscribe('topic')
        clientA.on('ack', ack => {
          if (JSON.parse(ack).action === 'subscribe') {
            done()
          }
        })
      })
      it('should receive acknowledgement for publishing', done => {
        clientA.publish('topic', 'Hello world')
        clientA.on('ack', ack => {
          if (JSON.parse(ack).action === 'publish') {
            done()
          }
        })
      })
      it('should receive acknowledgement for unsubscribing', done => {
        clientA.unsubscribe('topic')
        clientA.on('ack', ack => {
          if (JSON.parse(ack).action === 'unsubscribe') {
            done()
          }
        })
      })
      after(() => {
        clientA.removeAllListeners()
      })
    })

    describe('peering', () => {
      it('client B on server B should receive a message published to server A by client A', done => {
        clientB.subscribe('topic')
        clientA.publish('topic', 'Hello world')
        clientB.on('message', message => {
          message = JSON.parse(message)
          if (message.type === 'publish' && message.fromPeerServer) {
            done()
          }
        })
      })
      it('client A on server A should receive a message published to server B by client B', done => {
        clientA.subscribe('topic')
        clientB.publish('topic', 'Hello world')
        clientA.on('message', message => {
          message = JSON.parse(message)
          if (message.type === 'publish' && message.fromPeerServer) {
            done()
          }
        })
      })
      after(() => {
        clientA.removeAllListeners()
        clientB.removeAllListeners()
      })
    })

    describe('messages', () => {
      describe('topic heirarchy', () => {
        it('should recieve a message published to a subtopic', done => {
          clientA.subscribe('topic')
          clientA.publish('topic.sub', 'Hello world')
          clientA.unsubscribe('topic')
          clientA.on('message', message => {
            message = JSON.parse(message)
            if (
              message.type === 'publish' &&
              message.context === 'topic' &&
              message.topic === 'topic.sub'
            ) {
              done()
            }
          })
        })
        after(() => {
          clientA.removeAllListeners()
        })
      })

      describe('event listener', () => {
        it('should receive a published message from a subscribed channel via event listener', done => {
          clientA.subscribe('topic')
          clientA.publish('topic', 'Hello world')
          clientA.unsubscribe('topic')
          clientA.on('message', message => {
            message = JSON.parse(message)
            if (
              message.type === 'publish' &&
              message.message === 'Hello world'
            ) {
              done()
            }
          })
        })
        after(() => {
          clientA.removeAllListeners()
        })
      })

      describe('callback', () => {
        it('should receive a published message from a subscribed channel via callback', done => {
          const callback = message => {
            message = JSON.parse(message)
            if (
              message.type === 'publish' &&
              message.message === 'Hello world'
            ) {
              done()
            }
          }
          clientA.subscribe('topic', callback)
          clientA.publish('topic', 'Hello world')
          clientA.unsubscribe('topic')
        })
      })
    })
  })

  after(() =>
    setTimeout(() => {
      process.exit(0)
    }, 100)
  )
})
