const { Kafka } = require('kafkajs')
const { MongoClient } = require('mongodb')

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const consumer = kafka.consumer({ groupId: 'consumer-alerts' })
const producer = kafka.producer()
const mongoClient = new MongoClient('mongodb://localhost:27017')

const ALL_TOPICS = [
  'crypto.trades.binance.btcusdt',
  'crypto.trades.binance.ethusdt',
  'crypto.trades.coinbase.btcusd'
]

const lastPrices = {}
const VOLUME_THRESHOLD = 0.1
const PRICE_CHANGE_THRESHOLD = 0.001

async function start() {
  await mongoClient.connect()
  const db = mongoClient.db('crypto')
  const alerts = db.collection('alerts')
  console.log('MongoDB connecté')

  await consumer.connect()
  await producer.connect()
  await consumer.subscribe({ topics: ALL_TOPICS, fromBeginning: false })
  console.log('Consumer 3 connecté à Kafka')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const trade = JSON.parse(message.value.toString())
      const symbol = trade.symbol

      if (trade.quantity >= VOLUME_THRESHOLD) {
        const alert = {
          type: 'BIG_VOLUME',
          symbol,
          price: trade.price,
          quantity: trade.quantity,
          source: trade.source,
          message: `Gros volume détecté: ${trade.quantity} ${symbol} à $${trade.price}`,
          timestamp: new Date()
        }
        await alerts.insertOne(alert)
        await producer.send({
          topic: 'crypto.alerts',
          messages: [{ value: JSON.stringify(alert) }]
        })
        console.log(`🚨 ${alert.message}`)
      }

      if (lastPrices[symbol] !== undefined) {
        const priceChange = Math.abs(trade.price - lastPrices[symbol]) / lastPrices[symbol]
        if (priceChange >= PRICE_CHANGE_THRESHOLD) {
          const alert = {
            type: 'PRICE_SPIKE',
            symbol,
            price: trade.price,
            previousPrice: lastPrices[symbol],
            changePercent: parseFloat((priceChange * 100).toFixed(3)),
            source: trade.source,
            message: `Variation rapide ${symbol}: ${(priceChange * 100).toFixed(3)}% ($${lastPrices[symbol]} → $${trade.price})`,
            timestamp: new Date()
          }
          await alerts.insertOne(alert)
          await producer.send({
            topic: 'crypto.alerts',
            messages: [{ value: JSON.stringify(alert) }]
          })
          console.log(`⚡ ${alert.message}`)
        }
      }

      lastPrices[symbol] = trade.price
    }
  })
}

start()