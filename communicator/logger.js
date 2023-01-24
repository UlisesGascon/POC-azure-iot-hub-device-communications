const pino = require('pino')
const { join } = require('path')

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'yyyy-dd-mm, h:MM:ss TT'
    }
  }

}, pino.destination(join(process.cwd(), './communicator/logger.log')))

module.exports = { logger }
