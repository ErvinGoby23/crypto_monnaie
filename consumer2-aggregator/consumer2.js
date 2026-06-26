const { Kafka } = require('kafkajs')
const { MongoClient } = require('mongodb')

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const consumer = kafka.consumer({ groupId: 'consumer-aggregator' })
const mongoClient = new MongoClient('mongodb://localhost:27017')

const ALL_TOPICS = [
  'crypto.trades.binance.btcusdt',
  'crypto.trades.binance.ethusdt',
  'crypto.trades.coinbase.btcusd'
]

const windows = {}

const WINDOWS = [
  { name: '1min',  duration: 60000 },
  { name: '5min',  duration: 300000 },
  { name: '15min', duration: 900000 },
  { name: '1h',    duration: 3600000 }
]

function initWindow(symbol) {
  if (!windows[symbol]) {
    windows[symbol] = {}
    WINDOWS.forEach(w => {
      windows[symbol][w.name] = { prices: [], volumes: [], startTime: Date.now() }
    })
  }
}

async function start() {
  await mongoClient.connect()
  const db = mongoClient.db('crypto')
  const stats = db.collection('stats')
  console.log(' MongoDB connecté')

  await consumer.connect()
  await consumer.subscribe({ topics: ALL_TOPICS, fromBeginning: false })
  console.log(' Consumer 2 connecté à Kafka')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const trade = JSON.parse(message.value.toString())
      const symbol = trade.symbol

      initWindow(symbol)
      const now = Date.now()

      for (const w of WINDOWS) {
        const win = windows[symbol][w.name]
        win.prices.push(trade.price)
        win.volumes.push(trade.quantity)

        if (now - win.startTime >= w.duration) {
          const avgPrice = win.prices.reduce((a, b) => a + b, 0) / win.prices.length
          const totalVolume = win.volumes.reduce((a, b) => a + b, 0)

          const stat = {
            symbol,
            window: w.name,
            avgPrice: parseFloat(avgPrice.toFixed(2)),
            totalVolume: parseFloat(totalVolume.toFixed(6)),
            minPrice: Math.min(...win.prices),
            maxPrice: Math.max(...win.prices),
            tradeCount: win.prices.length,
            source: trade.source,
            windowStart: new Date(win.startTime),
            windowEnd: new Date(now)
          }

          await stats.insertOne(stat)
          console.log(`[${symbol}] ${w.name}: avg=$${stat.avgPrice} vol=${stat.totalVolume} trades=${stat.tradeCount}`)

          windows[symbol][w.name] = { prices: [], volumes: [], startTime: now }
        }
      }
    }
  })
}

start()