require('dotenv').config()

module.exports = {
  apps: [
    {
      name: 'communicator',
      script: 'communicator/index.js',
      env: {
        IOTHUB_DEVICE_CONNECTION_STRING: process.env.IOTHUB_DEVICE_CONNECTION_STRING
      }
    },
    {
      name: 'iot-device',
      script: 'iot-device/index.js'
    }
  ]
}
