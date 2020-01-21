# ps *(publish/subscribe)*

**ps** is a nodejs pub/sub system that provides both a client and a server. It uses websockets to transmit messages between client and server.

## Topics

**ps** uses a heirarchical topic system for client subscriptions. For example, a client could subscribe to the topic `news.uk`. They would then recieve messages published to `news.uk`, `news.uk.london`, `news.uk.birmingham` etc. but not from `news.fr` or `news.de`.

## Messages

Messages are JSON format and look like the following:
```
{
  "type": "subscribe" | "unsubscribe" | "publish",
  "timestamp": "2020-01-21T17:03:13.625Z",
  "topic": "news.uk",
  "context": "news",
  "message": "Hello news.uk channel!"
}
```
* `topic` lets a client know where the message was published to
* `context` lets a client know *why* they are receiving a certain message - in this instance the client is subscribed to `news`, where they received it, but not `news.uk`, where it was sent.
* `message` can be a string or an object

## Server example

```js
const PsServer = require('ps/server')

const server = new PsServer(8000)

server.on('subscribe', (topic, client) => {
  console.log(`${client} subscribed to ${topic}`)
})
```

## Client example

```js
const PsClient = require('ps/client')

const client = new PsClient('ws://localhost:8000')

client.on('open', () => {
  client.subscribe('news')
  client.publish('news', 'Hello news channel!')
  client.publish('news.uk', 'Hello news.uk channel!')
})

client.on('message', () => {
  console.log(message)
})

// => {"type":"publish","timestamp":"2020-01-21T17:03:13.625Z","topic":"news","message":"Hello news channel!","context":"news"}
// => {"type":"publish","timestamp":"2020-01-21T17:03:13.625Z","topic":"news.uk","message":"Hello news.uk channel!","context":"news"}
```
