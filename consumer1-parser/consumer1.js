const { Kafka } = require('kafkajs')
const { MongoClient } = require('mongodb')

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const consumer = kafka.consumer({ groupId: 'consumer-parser' })
const mongoClient = new MongoClient('mongodb://localhost:27017')

const ALL_TOPICS = [
  'crypto.trades.binance.btcusdt',
  'crypto.trades.binance.ethusdt',
  'crypto.trades.coinbase.btcusd'
]

async function start() {
  await mongoClient.connect()
  const db = mongoClient.db('crypto')
  const trades = db.collection('trades')
  console.log('✅ MongoDB connecté')

  await consumer.connect()
  await consumer.subscribe({ topics: ALL_TOPICS, fromBeginning: false })
  console.log('✅ Consumer 1 connecté à Kafka')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const trade = JSON.parse(message.value.toString())
      await trades.insertOne({
        ...trade,
        receivedAt: new Date()
      })
      console.log(`💾 Stocké: ${trade.symbol} - $${trade.price}`)
    }
  })
}

start()