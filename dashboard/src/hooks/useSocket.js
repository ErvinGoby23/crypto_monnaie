import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const CACHE_MAX_PER_SYMBOL = 60

export function useSocket() {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  const [tradesBySymbol, setTradesBySymbol] = useState({
    BTCUSDT: [], ETHUSDT: [], 'BTC-USD': []
  })
  const [alerts, setAlerts] = useState([])
  const [stats, setStats]   = useState({})
  const [prices, setPrices] = useState({ BTCUSDT: null, ETHUSDT: null, 'BTC-USD': null })

  useEffect(() => {
    const socket = io('http://localhost:3000')
    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('init', ({ trades: initTrades, stats: initStats, alerts: initAlerts }) => {
      const bySymbol = { BTCUSDT: [], ETHUSDT: [], 'BTC-USD': [] }
      initTrades.forEach(t => { if (bySymbol[t.symbol]) bySymbol[t.symbol].push(t) })
      setTradesBySymbol(bySymbol)
      setAlerts(initAlerts.slice(0, 20))

      const statsMap = {}
      initStats.forEach(s => {
        if (!statsMap[s.symbol]) statsMap[s.symbol] = {}
        statsMap[s.symbol][s.window] = s
      })
      setStats(statsMap)

      const priceMap = {}
      initTrades.forEach(t => { priceMap[t.symbol] = t.price })
      setPrices(prev => ({ ...prev, ...priceMap }))
    })

    socket.on('trade', (trade) => {
      const symbol = trade.symbol
      if (!['BTCUSDT', 'ETHUSDT', 'BTC-USD'].includes(symbol)) return
      setTradesBySymbol(prev => ({
        ...prev,
        [symbol]: [trade, ...prev[symbol]].slice(0, CACHE_MAX_PER_SYMBOL)
      }))
      setPrices(prev => ({ ...prev, [symbol]: trade.price }))
    })

    socket.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 20))
    })

    socket.on('stats', (statsArr) => {
      setStats(prev => {
        const next = { ...prev }
        statsArr.forEach(s => {
          if (!next[s.symbol]) next[s.symbol] = {}
          next[s.symbol][s.window] = s
        })
        return next
      })
    })

    return () => socket.disconnect()
  }, [])

  const trades = [
    ...tradesBySymbol.BTCUSDT,
    ...tradesBySymbol.ETHUSDT,
    ...tradesBySymbol['BTC-USD']
  ].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))

  return { connected, trades, tradesBySymbol, alerts, stats, prices, socket: socketRef.current }
}