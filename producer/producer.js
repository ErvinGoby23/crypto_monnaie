const { Kafka } = require('kafkajs')
const WebSocket = require('ws')
const { createClient } = require('redis')

const kafka = new Kafka({ brokers: ['localhost:9092'] })
const producer = kafka.producer()


const redis = createClient({ url: 'redis://localhost:6379' })
redis.on('error', (err) => console.error('Redis erreur:', err.message))

const REDIS_QUEUE_KEY = 'crypto:trades:buffer'
const REDIS_MAX_SIZE  = 10000

const TOPICS = {
  'BTCUSDT': 'crypto.trades.binance.btcusdt',
  'ETHUSDT': 'crypto.trades.binance.ethusdt',
  'BTC-USD': 'crypto.trades.coinbase.btcusd'
}


async function sendTrade(message) {
  const topic = TOPICS[message.symbol]

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    })
  } catch (kafkaErr) {
    console.warn(`Kafka KO → Redis fallback: ${message.symbol} $${message.price}`)
    try {
      const queueSize = await redis.lLen(REDIS_QUEUE_KEY)
      if (queueSize < REDIS_MAX_SIZE) {
        await redis.rPush(REDIS_QUEUE_KEY, JSON.stringify({ ...message, topic }))
        console.log(`Redis buffer: ${queueSize + 1}/${REDIS_MAX_SIZE} trades en attente`)
      } else {
        console.error('Redis buffer plein, trade perdu')
      }
    } catch (redisErr) {
      console.error('Redis KO aussi:', redisErr.message)
    }
  }
}


async function flushRedisToKafka() {
  try {
    const queueSize = await redis.lLen(REDIS_QUEUE_KEY)
    if (queueSize === 0) return

    console.log(`Flush Redis → Kafka: ${queueSize} trades en attente`)
    let sent = 0

    while (true) {
      const raw = await redis.lPop(REDIS_QUEUE_KEY)
      if (!raw) break

      const { topic, ...message } = JSON.parse(raw)
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }]
      })
      sent++
    }

    console.log(`${sent} trades rejoués depuis Redis vers Kafka`)
  } catch {
    // Kafka encore KO, Redis garde les données
  }
}

setInterval(flushRedisToKafka, 5000)


async function startBinance(symbol) {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`)

  ws.on('open', () => console.log(`Binance ${symbol} connecté`))

  ws.on('message', async (data) => {
    const trade = JSON.parse(data)
    const message = {
      symbol: trade.s,
      price: parseFloat(trade.p),
      quantity: parseFloat(trade.q),
      timestamp: trade.T,
      source: 'binance'
    }
    await sendTrade(message)
    console.log(`Binance ${message.symbol} - $${message.price}`)
  })

  ws.on('close', () => {
    console.log(`Binance ${symbol} déconnecté, reconnexion...`)
    setTimeout(() => startBinance(symbol), 3000)
  })

  ws.on('error', (err) => console.error(`Binance ${symbol} error:`, err.message))
}


async function startCoinbase() {
  const ws = new WebSocket('wss://advanced-trade-ws.coinbase.com')

  ws.on('open', () => {
    console.log('Coinbase connecté')
    ws.send(JSON.stringify({
      type: 'subscribe',
      product_ids: ['BTC-USD'],
      channel: 'market_trades'
    }))
  })

  ws.on('message', async (data) => {
    const msg = JSON.parse(data)
    if (msg.channel === 'market_trades' && msg.events) {
      for (const event of msg.events) {
        for (const trade of (event.trades || [])) {
          const message = {
            symbol: 'BTC-USD',
            price: parseFloat(trade.price),
            quantity: parseFloat(trade.size),
            timestamp: Date.now(),
            source: 'coinbase'
          }
          await sendTrade(message)
          console.log(`Coinbase BTC-USD - $${message.price}`)
        }
      }
    }
  })

  ws.on('close', () => {
    console.log('Coinbase déconnecté, reconnexion...')
    setTimeout(() => startCoinbase(), 3000)
  })

  ws.on('error', (err) => console.error('Coinbase error:', err.message))
}


async function start() {
  await redis.connect()
  console.log('Redis connecté')

  await producer.connect()
  console.log('Kafka producer connecté')

  startBinance('BTCUSDT')
  startBinance('ETHUSDT')
  startCoinbase()
}

start()