const store = require('./store')
const generateSimulatedData = () => {
  const windSpeed = 10 + (Math.random() * 4) // range: [10, 14]
  const temperature = 20 + (Math.random() * 10) // range: [20, 30]
  const humidity = 60 + (Math.random() * 20) // range: [60, 80]
  return { windSpeed, temperature, humidity }
}

// Generate data every second
setInterval(() => {
  const { maxTemp, minTemp } = store.settings.getAll()
  const data = generateSimulatedData()
  if (data.temperature > maxTemp || data.temperature < minTemp) {
    data.alert = 'Temperature is out of range'
  }
  store.values.save(data)
}, 1000)
