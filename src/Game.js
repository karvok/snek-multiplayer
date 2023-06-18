const {
  GAME_SPEED,
  INITIAL_SNAKE_SIZE,
  SNAKE_COLORS,
  DOT_COLORS,
  SNAKE_COLLISIONS,
  AUTO_MOVE_DEFAULT,
  MAX_PLAYER_NAME_LENGTH,
  MAX_PLAYER_MSG_LENGTH
} = require('./constants')

const { randomNum } = require('./utils')
const { Snake } = require('./Snake')
const { Dot } = require('./Dot')

/**
 * @class Game
 *
 * The Game class tracks the state of three things:
 *
 * 1. The snake, including its direction, velocity, and location
 * 2. The dot
 * 3. The score
 *
 * The i/o of the game is handled by a separate UserInterface class, which is
 * responsible for detecting all event handlers (key press), creating the
 * screen, and drawing elements to the screen.
 */
class Game {
  constructor(ui, server) {
    // User interface class for all i/o operations
    this.ui = ui
    this.server = server

    this.autoMove = AUTO_MOVE_DEFAULT

    this.reset()

    // Bind handlers to UI so we can detect input change from the Game class
    this.ui.bindHandlers(
      () => {}, //this.changeDirection.bind(this),
      this.quit.bind(this),
      this.start.bind(this)
    )

    this.server.bindHandlers(
      this.handlePlayerInput.bind(this),
      this.newPlayer.bind(this),
      this.playerLeft.bind(this)
    )
  }

  reset() {
    // Set up initial state
    this.snakes = []
    this.dots = []
    this.score = 0
    this.timer = null

    // Generate the first dot before the game begins
    // this.generateDot()
    this.ui.resetScore()
    this.ui.render()
  }

  handlePlayerInput(input, client) {
    const snake = this.snakes.find(s => s.client === client)
    if (!snake) return false

    const dir = input.match(/Move: (.*)/)
    const name = input.match(/Name: (.*)/)
    const say  = input.match(/Say: (.*)/)

    if (dir) {
      return snake.changeDirection(dir[1])
    } else if (name) {
      return snake.changeName(name[1].trim().substring(0, MAX_PLAYER_NAME_LENGTH))
    } else if (say) {
      return snake.setMessage(say[1].trim().substring(0, MAX_PLAYER_MSG_LENGTH))
    }

    try {
      client.write('Huh?\n');
    } catch (e) {
      // nothing to do really.
    }

    return false
  }

  // This logs to the server console
  // handlePlayerInput(input, client) {
  //   const snake = this.snakes.find(s => s.client === client)
  //   if (!snake) return false
  //   const dir = input.match(/Move: (.*)/)
  //   const name = input.match(/Name: (.*)/)
  //   const say  = input.match(/Say: (.*)/)
  //   if (dir) {
  //     return snake.changeDirection(dir[1])
  //   } else if (name) {
  //     const playerName = name[1].trim().substring(0, MAX_PLAYER_NAME_LENGTH);
  //     snake.changeName(playerName);
  //     // Send a message to the console with the player's name
  //     console.log(`Player "${playerName}" has joined the game! 😀`);
  //     return true;
  //   } else if (say) {
  //     return snake.setMessage(say[1].trim().substring(0, MAX_PLAYER_MSG_LENGTH))
  //   }
  //   try {
  //     client.write('Huh?\n');
  //   } catch (e) {
  //     // nothing to do really.
  //   }
  //   return false
  // }

  safeSnakeStartingCoords() {
    let attempts = 0;

    while(attempts < 100) {
      // console.log('trying: ', attempts);
      const x = randomNum(0 + INITIAL_SNAKE_SIZE, this.ui.gameContainer.width - 1 - INITIAL_SNAKE_SIZE)
      const y = randomNum(0 + INITIAL_SNAKE_SIZE, this.ui.gameContainer.height - 1 - INITIAL_SNAKE_SIZE)

      if (this.isSafe(x, y)) return { x, y }
      attempts += 1
    }

    // we failed to find a safe starting pos
    return false
  }

  newPlayer(client) {
    const coords = this.safeSnakeStartingCoords()
    if (coords) {
      const snake = new Snake(
        client,
        INITIAL_SNAKE_SIZE,
        coords,
        this.randomItem(SNAKE_COLORS),
        this.autoMove,
        this.snakeMoved.bind(this)
      )
      this.snakes.push(snake)
    } else {
      try {
        client.write("No space for you, try again soon!\n", () => client.end())
      } catch (e) {
        // meh
      }
    }
  }

  randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  playerLeft(client) {
    const index = this.snakes.findIndex(s => s.client === client)
    if (index >= 0) this.removeSnake(this.snakes[index], index)
  }

  // This logs to the server console
  // playerLeft(client) {
  //   const index = this.snakes.findIndex(s => s.client === client)
  //   if (index >= 0) {
  //     const snake = this.snakes[index];
  //     const playerName = snake.name;
  //     this.removeSnake(snake, index);
  //     // Send a message to the console with the player's name
  //     console.log(`Player "${playerName}" has left the game! ☹️`);
  //   }
  // }

  checkDotHits(position, snake) {
    for (const [i, dot] of this.dots.entries()) {
      if (position.x === dot.x && position.y === dot.y) {
        snake.scored()
        snake.growBy += 1
        this.ui.updateScore(snake.score)
        this.removeDot(dot, i)
        return
      }
    }
  }

  /**
   * Set the velocity of the snake based on the current direction. Create a new
   * head by adding a new segment to the beginning of the snake array,
   * increasing by one velocity. Remove one item from the end of the array to
   * make the snake move, unless the snake collides with a dot - then increase
   * the score and increase the length of the snake by one.
   *
   */
  snakeMoved(position, snake) {
    // If the snake lands on a dot, increase the score and generate a new dot
    // check collisions with Dots
    this.checkDotHits(position, snake)
  }

  isSafe(x, y) {
    // If the pixel is on a snake, regenerate the dot
    return(
      !this.snakes.some(s => s.isAt({ x, y })) &&
      !this.dots.some(d => d.isAt({x, y}))
    )
  }

  generateDot() {
    // Generate a dot at a random x/y coordinate
    const x = randomNum(0, this.ui.gameContainer.width - 1)
    const y = randomNum(1, this.ui.gameContainer.height - 1)

    if (!this.isSafe(x, y)) return this.generateDot()

    const dot = new Dot(x, y, this.randomItem(DOT_COLORS))
    this.dots.push(dot)
  }

  generateDots() {
    const maxDots = Math.ceil(this.snakes.length / 2)
    const diff = maxDots - this.dots.length
    for (let i = 0; i < diff; i++) this.generateDot()
  }

  drawSnakes() {
    // Render each snake segment as a pixel
    for (let snake of this.snakes) {
      this.drawSnake(snake)
    }
  }

  drawSnake(snake) {
    snake.segments.forEach((segment, i) => {
      this.ui.draw(segment, i === 0 ? 'gray' : snake.color)
    })
    if (snake.message) {
      const msg = snake.name ? `${snake.name}: ${snake.message}` : snake.message
      const segment = snake.segments[0]
      this.ui.text({x: segment.x - 1, y: segment.y - 1}, msg, snake.color)
    }
  }

  drawDots() {
    // Render the dot as a pixel
    for (const dot of this.dots) {
      this.ui.draw(dot, dot.color)
    }
  }

  removeSnake(snake, index, message) {
    snake.bye(message)
    if (index !== undefined && index >= 0) {
      this.snakes.splice(index, 1)
    }
  }

  removeDot(dot, index) {
    if (index !== undefined && index >= 0) {
      this.dots.splice(index, 1)
    }
  }

  checkPlayerHits() {
    const width = this.ui.gameContainer.width
    const height = this.ui.gameContainer.height

    for (let [i, snake] of this.snakes.entries()) {
      if (snake.hit(width, height)) {
        return this.removeSnake(snake, i, 'you crashed, so you ded.')
      }

      if (SNAKE_COLLISIONS) {
        for (let [j, otherSnake] of this.snakes.entries()) {
          if (i !== j && snake.hitSnake(otherSnake)) {
            return this.removeSnake(snake, i, 'you hit another snake, so you ded.')
          }
        }
      }
    }
  }

  moveSnakes() {
    this.snakes.forEach(s => s.move.bind(s)())
  }

  tick() {
    this.checkPlayerHits()
    this.ui.clearScreen()
    this.generateDots()
    this.drawDots()
    if (this.autoMove) this.moveSnakes()
    this.drawSnakes()
    this.ui.render()
  }

  start() {
    if (!this.timer) {
      this.reset()

      this.timer = setInterval(this.tick.bind(this), GAME_SPEED)
    }
  }

  quit() {
    process.exit(0)
  }
}

module.exports = { Game }
