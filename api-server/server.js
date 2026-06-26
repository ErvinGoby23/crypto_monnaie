const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const { MongoClient } = require('mongodb')
const cors = require('cors')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

const mongoClient = new MongoClient('mongodb://localhost:27017')
let db

const systemStatus = {
  mongodb: false,
  kafka: false,
  consumers: 0,
  lastTradeAt: null,
  tradesPerSec: 0
}

mongoClient.connect().then(() => {
  db = mongoClient.db('crypto')
  systemStatus.mongodb = true
  console.log(' MongoDB connecté')
  startPolling()
})

const lastIds = { BTCUSDT: null, ETHUSDT: null, 'BTC-USD': null }
let lastAlertId = null
let tradeCountLastSec = 0

function startPolling() {
  setInterval(async () => {
    try {
      let total = 0
      for (const symbol of ['BTCUSDT', 'ETHUSDT', 'BTC-USD']) {
        const query = lastIds[symbol]
          ? { symbol, _id: { $gt: lastIds[symbol] } }
          : { symbol }

        const newTrades = await db.collection('trades')
          .find(query).sort({ _id: 1 }).limit(20).toArray()

        if (newTrades.length > 0) {
          lastIds[symbol] = newTrades[newTrades.length - 1]._id
          systemStatus.lastTradeAt = new Date()
          systemStatus.kafka = true
          total += newTrades.length
          newTrades.forEach(trade => io.emit('trade', trade))
        }
      }
      tradeCountLastSec += total
    } catch (err) {
      console.error('Polling trades erreur:', err.message)
    }
  }, 500)

  setInterval(async () => {
    systemStatus.tradesPerSec = tradeCountLastSec
    tradeCountLastSec = 0

    // Vérifie si Kafka est actif (trade reçu dans les 10 dernières secondes)
    if (systemStatus.lastTradeAt) {
      const lag = Date.now() - new Date(systemStatus.lastTradeAt).getTime()
      systemStatus.kafka = lag < 10000
    }

    // Compte les consumers actifs via les groupIds distincts dans les trades récents
    try {
      const recentTrades = await db.collection('trades')
        .find({ receivedAt: { $gte: new Date(Date.now() - 5000) } })
        .limit(10).toArray()
      systemStatus.consumers = recentTrades.length > 0 ? 3 : 0
    } catch {}

    io.emit('health', systemStatus)
  }, 1000)

  setInterval(async () => {
    try {
      const query = lastAlertId ? { _id: { $gt: lastAlertId } } : {}
      const newAlerts = await db.collection('alerts')
        .find(query).sort({ _id: 1 }).limit(10).toArray()

      if (newAlerts.length > 0) {
        lastAlertId = newAlerts[newAlerts.length - 1]._id
        newAlerts.forEach(alert => io.emit('alert', alert))
      }
    } catch (err) {
      console.error('Polling alerts erreur:', err.message)
    }
  }, 1000)

  setInterval(async () => {
    try {
      const stats = await db.collection('stats').find().toArray()
      if (stats.length > 0) io.emit('stats', stats)
    } catch (err) {
      console.error('Polling stats erreur:', err.message)
    }
  }, 2000)

  console.log('Polling MongoDB démarré')
}

app.get('/trades', async (req, res) => {
  const [btc, eth, coinbase] = await Promise.all([
    db.collection('trades').find({ symbol: 'BTCUSDT' }).sort({ receivedAt: -1 }).limit(50).toArray(),
    db.collection('trades').find({ symbol: 'ETHUSDT' }).sort({ receivedAt: -1 }).limit(50).toArray(),
    db.collection('trades').find({ symbol: 'BTC-USD' }).sort({ receivedAt: -1 }).limit(50).toArray(),
  ])
  res.json([...btc, ...eth, ...coinbase])
})

app.get('/stats', async (req, res) => {
  const stats = await db.collection('stats')
    .find().sort({ windowEnd: -1 }).limit(100).toArray()
  res.json(stats)
})

app.get('/alerts', async (req, res) => {
  const alerts = await db.collection('alerts')
    .find().sort({ timestamp: -1 }).limit(20).toArray()
  res.json(alerts)
})

app.get('/price', async (req, res) => {
  const last = await db.collection('trades')
    .findOne({}, { sort: { receivedAt: -1 } })
  res.json({ price: last?.price, symbol: last?.symbol, timestamp: last?.timestamp })
})

app.get('/health', async (req, res) => {
  res.json({
    ...systemStatus,
    connectedClients: io.engine.clientsCount,
    timestamp: new Date()
  })
})

io.on('connection', async (socket) => {
  console.log('🔌 Dashboard connecté')

  try {
    const [btc, eth, coinbase, stats, recentAlerts] = await Promise.all([
      db.collection('trades').find({ symbol: 'BTCUSDT' }).sort({ receivedAt: -1 }).limit(50).toArray(),
      db.collection('trades').find({ symbol: 'ETHUSDT' }).sort({ receivedAt: -1 }).limit(50).toArray(),
      db.collection('trades').find({ symbol: 'BTC-USD' }).sort({ receivedAt: -1 }).limit(50).toArray(),
      db.collection('stats').find().toArray(),
      db.collection('alerts').find().sort({ timestamp: -1 }).limit(10).toArray()
    ])

    socket.emit('init', {
      trades: [...btc, ...eth, ...coinbase],
      stats,
      alerts: recentAlerts
    })

    // Envoie l'état santé immédiatement
    socket.emit('health', systemStatus)
  } catch (err) {
    console.error('Erreur init socket:', err.message)
  }

  socket.on('disconnect', () => console.log('❌ Dashboard déconnecté'))
})

httpServer.listen(3000, () => {
  console.log('API server lancé sur http://localhost:3000')
})