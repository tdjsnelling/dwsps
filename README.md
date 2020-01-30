# dwsps

> _distributed websocket publish/subscribe_

[![CircleCI](https://circleci.com/gh/tdjsnelling/dwsps.svg?style=svg&circle-token=8b2de60c02024d151cb74edfef4a5b4fe456b0b1)](https://circleci.com/gh/tdjsnelling/dwsps)
![npm](https://img.shields.io/npm/v/dwsps)

**dwsps** is a distributed nodejs pub/sub system. It uses websockets to transmit messages between client and server, and between peered servers.

- [Topics](#topics)
- [Messages](#messages)
- [Acknowledgements](#acknowledgements)
- [Distribution](#distribution)
- [Usage](#usage)
  - [Basic server example](#basic-server-example)
  - [Basic client example](#basic-client-example)
- [License](#license)

## Topics

**dwsps** uses a heirarchical topic system for client subscriptions, each level divided by a full-stop `.`. For example, a client could subscribe to the topic `news.uk`. They would then recieve messages published to `news.uk`, `news.uk.london`, `news.uk.birmingham` etc. but not from `news.fr` or `news.de`.

Note: if a client is subscribed to a parent topic and a sub-topic of the parent, unsubscribing from the parent topic will _not_ also unsubscribe the client from the sub-topic. Each subscription must be unsubscribed from explicitly.

## Messages

Messages are JSON format and look like the following:

```
{
  "type": "publish",
  "timestamp": "2020-01-21T17:03:13.625Z",
  "topic": "news.uk",
  "context": "news",
  "message": "Hello news.uk channel!"
}
```

- `topic` lets a client know where the message was published to
- `context` lets a client know _why_ they are receiving a certain message - in this instance the client is subscribed to `news`, where they received it, but not `news.uk`, where it was sent.
- `message` can be any valid JSON data

## Acknowledgements

When a client performs an action, the server will send an acknowledgment in reply if it received the message and executed the action correctly. These can be listened for with the client `ack` event.

Ack messages look like this:

```
{
  "type": "ack",
  "action": "subscribe",
  "timestamp": "2020-01-22T15:44:04.674Z",
  "topic": "news"
}
```

## Distribution

Multiple **dwsps** servers can be peered with one another to create a distributed network. Once servers are peered, then a message published to one server will also be published to all servers, and delivered to their own subscribed clients respectively. Subscribed clients are not replicated between servers, instead held in memory on a per server basis.

Messages that were forwarded from another server will also contain a `fromPeerServer: true` flag.

Note: adding Server A as a peer of Server B will not enable 2-way communication: B will forward messages to A but not vice versa. Server B must also be added as a peer of Server A. See [example.js](./example.js) for an example of peering servers.

## Usage

### Basic server example

```js
const PSServer = require('dwsps/server')

const server = new PSServer({ port: 8000 })

server.on('subscribe', (topic, client) => {
  console.log(`${client} subscribed to ${topic}`)
})
```

### Basic client example

In this example, an event listener is used to receive all messages from every topic the client is subscribed to.

```js
const PSClient = require('dwsps/client')

const client = new PSClient('ws://localhost:8000')

// Must wait for client to establish connection before performing actions
client.on('open', () => {
  client.subscribe('news')
  client.publish('news', 'Hello news channel!')
  client.publish('news.uk', 'Hello news.uk channel!')
})

// Log acknowledgments from the server
client.on('ack', ack => {
  console.log(ack)
})

// Log messages received by the client
client.on('message', message => {
  console.log(message)
})
```

If you only want to take action on certain received messages, you can either:

- Implement this yourself using the event listener method and parsing the message topic, or
- Pass a callback function to the `subscribe` method which will only be called when a message is received matching that particular subscription.

```js
const PSClient = require('dwsps/client')

const client = new PSClient('ws://localhost:8000')

// Create a callback function that will be called when the client receives a
// message matching the topic `news`.
const newsHandler = message => {
  console.log(message)
}

// Must wait for client to establish connection before performing actions
client.on('open', () => {
  client.subscribe('news', newsHandler)
  client.publish('news', 'Hello news channel!')
})
```

## License

MIT. See [LICENSE](./LICENSE).
