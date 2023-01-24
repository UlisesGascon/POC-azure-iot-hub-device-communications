const Protocol = require('azure-iot-device-mqtt').Mqtt
const Client = require('azure-iot-device').Client
const Message = require('azure-iot-device').Message
const { logger } = require('./logger')
const { exec } = require('child_process')
const { statSync, createReadStream } = require('fs')
const { join } = require('path')

const handleConnection = async deviceConnectionString => {
  const client = Client.fromConnectionString(deviceConnectionString, Protocol)

  client.on('connect', () => logger.info('Client connected'))
  client.on('error', err => logger.error(err.message))
  client.on('disconnect', () => logger.info('Client disconnected'))
  client.on('message', msg => logger.info('Id: ' + msg.messageId + ' Body: ' + msg.data))

  await client.open()
  return client
}

const sendMessage = async (client, payload) => {
  const message = new Message(JSON.stringify(payload))
  await client.sendEvent(message)
}

const getDesireChangesFromTwin = (client, cb = () => {}) => {
  // Get device Twin
  client.getTwin((err, twin) => {
    if (err) {
      logger.error('could not get twin')
      cb(err)
    } else {
      logger.info('twin acquired')

      logger.info('twin contents:')
      logger.info(twin.properties)

      twin.on('properties.desired', function (delta) {
        logger.info('new desired properties received:')
        logger.info(JSON.stringify(delta))
        logger.info('Full picture:')
        logger.info(JSON.stringify(twin.properties))
        cb(null, { ...twin.properties, delta })
      })
    }
  })
}

const updateTwin = (client, patch, cb = () => {}) => {
  client.getTwin((err, twin) => {
    if (err) {
      logger.error('Update Twin: could not get twin')
      cb(err)
    } else {
      logger.info('Update Twin: twin acquired')
      twin.properties.reported.update(patch, (err) => {
        if (err) {
          logger.info(err)
        }
        cb(err)
      })
    }
  })
}

const getC2DMessage = (client, cb = () => {}) => {
  client.on('message', function (msg) {
    logger.info('C2D Message - Id: ' + msg.messageId + ' Body: ' + msg.data)
    client.complete(msg, err => {
      if (err) {
        logger.error('complete error: ' + err.toString())
      }
      cb(err)
    })
  })
}

const handleCmdExecution = (cmd) => (req, res) => {
  logger.info('CMD Execution: Method payload: ' + JSON.stringify(req.payload))
  exec(cmd, err => {
    if (err) {
      logger.error('CMD Execution: Error:', err)
      res.send(500, err.message)
    } else {
      res.send(200, 'Success')
    }
    logger.info('CMD Execution: Method response sent')
  })
}

const uploadToBlob = (localFilePath, storageBlobName) => (client) => (req, res) => {
  logger.info('Pushing blob to Azure IOT Central...')
  const fileStats = statSync(localFilePath)
  const fileStream = createReadStream(localFilePath)
  client.uploadToBlob(storageBlobName, fileStream, fileStats.size, err => {
    if (err) {
      logger.error(`error uploading file: ${err.constructor.name}: ${err.message}`)
      fileStream.destroy()
      res.send(500, err.message)
      return
    }
    fileStream.destroy()
    res.send(200, 'Success')
  })
}

module.exports = {
  handleConnection,
  sendMessage,
  updateTwin,
  getC2DMessage,
  getDesireChangesFromTwin,
  runStopDevice: handleCmdExecution('pm2 stop iot-device'),
  runStartDevice: handleCmdExecution('pm2 start iot-device'),
  runRestartDevice: handleCmdExecution('pm2 reset iot-device'),
  runLogSync: uploadToBlob(join(process.cwd(), './communicator/logger.log'), 'device.log')
}
