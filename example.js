/* eslint-disable no-console */
const PSServer = require('./server')
const PSClient = require('./client')

// Create 2 servers peered with one another
const server1 = new PSServer({ port: 8000, peers: ['ws://localhost:8001'] })
const server2 = new PSServer({ port: 8001, peers: ['ws://localhost:8000'] })

// Log server subscribe events
server1.on('subscribe', (topic, client) => {
  console.log(`Server 1: ${client} subscribed to ${topic}`)
})

server2.on('subscribe', (topic, client) => {
  console.log(`Server 2: ${client} subscribed to ${topic}`)
})

// Create 2 clients, one connected to each server
const client1 = new PSClient('ws://localhost:8000')
const client2 = new PSClient('ws://localhost:8001')

// Log client message events
client1.on('message', message => {
  console.log('Client 1: ' + message)
})

client2.on('message', message => {
  console.log('Client 2: ' + message)
})

// When client 1 is ready, subscribe to a topic and publish some messages
client1.on('open', () => {
  client1.subscribe('news')
  client1.publish('news', 'Hello news channel.')
  client1.publish('news.uk', 'Hello news.uk channel.')
})

// When client 2 is ready, subscribe to a topic
client2.on('open', () => {
  client2.subscribe('news.uk')
})

/*
=> Server 1: ::ffff:127.0.0.1 subscribed to news
=> Server 2: ::ffff:127.0.0.1 subscribed to news.uk
=> Client 1: {"type":"publish","timestamp":"2020-01-22T15:04:40.076Z","topic":"news","message":"Hello news channel.","context":"news"}
=> Client 1: {"type":"publish","timestamp":"2020-01-22T15:04:40.076Z","topic":"news.uk","message":"Hello news.uk channel.","context":"news"}
=> Client 2: {"type":"publish","timestamp":"2020-01-22T15:04:40.076Z","topic":"news.uk","message":"Hello news.uk channel.","fromPeerServer":true,"context":"news.uk"}
*/
