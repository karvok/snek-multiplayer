const {
  MAX_IDLE_TIMEOUT,
  PORT
} = require('./constants')

const net = require('net');

// Use snake emoji to represent players remaining
const snakeEmoji = '🐍';
let length;
let snakeString;

/**
 * @class UserInterface
 *
 * Interact with the input (keyboard directions) and output (creating screen and
 * drawing pixels to the screen). Currently this class is one hard-coded
 * interface, but could be made into an abstract and extended for multiple
 * interfaces - web, terminal, etc.
 */
class RemoteInterface {
  constructor() {
    this.clients = []
    this.launchServer()
  }

  launchServer() {
    this.server = net.createServer((socket) => {
      // Important: This error handler  is different than the one below! - KV
      socket.on('error', (err) => {
        // ignore errors! - Without this callback, we can get a ECONNRESET error that crashes the server - KV
      })
    })
      .on('connection', this.handleNewClient.bind(this))
      .on('error', (err) => {
        // handle errors here
        console.log('Error: ', err);
        // throw err
      })
      .listen(PORT, () => {
        console.log('opened server on', this.server.address())
      })
  }

  idleBoot(client) {
    try {
      client.write('you ded cuz you idled\n', () => client.end())
    } catch (e) {
      // nothing to do really.
    }
  }

  resetIdleTimer(client, time) {
    if (client.idleTimer) clearTimeout(client.idleTimer)
    client.idleTimer = setTimeout(
      this.idleBoot.bind(this, client),
      time
    )
  }

  handleNewClient(client) {
    // process.stdout.write('\x07')
    client.setEncoding('utf8')
    this.clients.push(client)
    this.resetIdleTimer(client, MAX_IDLE_TIMEOUT / 2)

    length = this.clients.length;
    snakeString = snakeEmoji.repeat(length);

    // Send message to new joiner
    // Additional spacing used so it displays uniformly in player console
    client.write(`Welcome new snek fren! 😀    Snakes in the game: ${snakeString}`);

    // Additional spacing used so it displays uniformly in player console
    const newPlayerMessage = `A new snek fren joined! 😀   Snakes in the game: ${snakeString}`;

    // Broadcast message to all players
    this.clients.forEach((player) => {
      if (player !== client) {
        player.write(newPlayerMessage);
      }
    });

    if (this.newClientHandler) this.newClientHandler(client)

    client.on('data', this.handleClientData.bind(this, client))
    client.on('end', this.handleClientEnded.bind(this, client))
  }

  handleClientData(client, data) {
    if (this.clientDataHandler) {
      if (this.clientDataHandler(data, client)) this.resetIdleTimer(client, MAX_IDLE_TIMEOUT)
    }
  }

  handleClientEnded(client) {
    if (client.idleTimer) clearTimeout(client.idleTimer)
    if (this.clientEndHandler) this.clientEndHandler(client)

    // Remove the player from the list of players
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);

      length = this.clients.length;
      snakeString = snakeEmoji.repeat(length);

      // Broadcast message to all remaining players
      // Additional spacing used so it displays uniformly in player console
      const playerLeftMessage = `A snek fren left! ☹️         Snakes in the game: ${snakeString}`;
      this.clients.forEach((player) => {
        if (player !== client) {
          player.write(playerLeftMessage);
        }
      });
    }
  }

  bindHandlers(clientDataHandler, newClientHandler, clientEndHandler) {
    // Event to handle keypress i/o
    this.newClientHandler = newClientHandler
    this.clientDataHandler = clientDataHandler
    this.clientEndHandler = clientEndHandler
    // this.screen.on('keypress', keyPressHandler)
    // this.screen.key(['escape', 'q', 'C-c'], quitHandler)
    // this.screen.key(['enter'], enterHandler)
  }
}

module.exports = { RemoteInterface }
