const PORT = 50541

const GAME_SPEED = 50
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
}
const INITIAL_SNAKE_SIZE = 4
const SNAKE_COLORS = [
  '#0F0FFF', // blue
  '#0FFFFF', // bright blue
  '#0F0FF0', // navy blue
  '#018E42', // green
  '#B75D69', // pink-ish
  '#1B5299', // blue
  '#9FC2CC', // lighter blue
  '#E3C16F', // beige
  '#729B79', // seafoam green (renders as mild gray)
  '#2E2C2F', // dark gray
  '#9EE493', // brighter green
  '#BA1200', // fancy red
  '#725AC1', // purple
  '#E1BC29', // yellow
  '#7768AE', // lighter purple
  '#F038FF', // magenta
  '#E2EF70', // keylime pie?
  '#EF709D', // pink
  '#955E42', // burnt orange
  '#DB7F67', // orange
  '#DBAD6A', // light orange
  '#628395', // pale blue / teal
  '#7C898B', // gray
  '#FB5607', // orange proper
  '#FF006E', // pink proper
  '#8338EC', // purple proper
  '#FFBE0B', // yellow proper
  '#3A86FF'  // light blue
]
const DOT_COLORS = [
  'red'
]
const BG_COLOR = 'white'

const MAX_PLAYER_NAME_LENGTH = 8 // was 3
const MAX_PLAYER_MSG_LENGTH = 20

const SNAKE_COLLISIONS = true
const MAX_IDLE_TIMEOUT = 15000 // ms

// how long each Player/Snake's broadcast message stays on for
const MESSAGE_TIMEOUT = 5000 // ms

// auto move is the usual snake mode
// its off, meaning snakes are still until moved by players
const AUTO_MOVE_DEFAULT = false

module.exports = {
  GAME_SPEED,
  DIRECTIONS,
  INITIAL_SNAKE_SIZE,
  SNAKE_COLORS,
  DOT_COLORS,
  SNAKE_COLLISIONS,
  MAX_IDLE_TIMEOUT,
  MESSAGE_TIMEOUT,
  AUTO_MOVE_DEFAULT,
  PORT,
  BG_COLOR,
  MAX_PLAYER_NAME_LENGTH,
  MAX_PLAYER_MSG_LENGTH
}
