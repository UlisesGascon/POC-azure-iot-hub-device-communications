require('dotenv').config()
const {
  handleConnection,
  sendMessage,
  getDesireChangesFromTwin,
  getC2DMessage,
  updateTwin,
  runStopDevice,
  runStartDevice,
  runRestartDevice,
  runLogSync
} = require('./utils')
const store = require('./store')
const deviceConnectionString = process.env.IOTHUB_DEVICE_CONNECTION_STRING

;(async () => {
  // Handle connection
  const client = await handleConnection(deviceConnectionString)

  // Register device method
  client.onDeviceMethod('stop', runStopDevice)
  client.onDeviceMethod('start', runStartDevice)
  client.onDeviceMethod('restart', runRestartDevice)
  client.onDeviceMethod('sync-logs', runLogSync(client))

  // Listen for desired properties changes and update local settings
  getDesireChangesFromTwin(client, (err, { desired, delta }) => {
    if (!err) {
      const deviceSettings = store.settings.getAll()
      const { $version, ...dataDesired } = desired
      const data = { ...deviceSettings, ...dataDesired }
      store.settings.save(data)
    }
  })

  // Listen for C2D messages
  getC2DMessage(client)

  // Send telemetry (each 5 seconds)
  setInterval(() => {
    const data = store.values.getAll()
    sendMessage(client, data)
  }, 5000)

  // Send Config to IoT Hub after initialization (2s)
  setTimeout(() => {
    const data = store.settings.getAll()
    updateTwin(client, data)
  }, 2000)
})()
