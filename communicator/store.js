const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const readJSONFileSync = (filename) => {
  const content = readFileSync(filename, 'utf8')
  return JSON.parse(content)
}

const writeJSONFileSync = (filename, data) => {
  const content = JSON.stringify(data)
  writeFileSync(filename, content, 'utf8')
}

module.exports = {
  values: {
    getAll: () => readJSONFileSync(join(process.cwd(), './iot-device/data/values.json'))
  },
  settings: {
    save: (value) => writeJSONFileSync(join(process.cwd(), './iot-device/data/settings.json'), value),
    getAll: () => readJSONFileSync(join(process.cwd(), './iot-device/data/settings.json'))
  }
}
