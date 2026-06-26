import { useSocket } from './hooks/useSocket'
import { Ticker } from './components/Ticker'
import { KpiGrid } from './components/KpiGrid'
import { PriceChart } from './components/PriceChart'
import { TradesFeed } from './components/TradesFeed'
import { AlertsList } from './components/AlertsList'
import { VolumeStats } from './components/VolumeStats'
import { SystemHealth } from './components/SystemHealth'

export default function App() {
  const { connected, trades, tradesBySymbol, alerts, stats, prices, socket } = useSocket()

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', color: '#e0e0e0', fontFamily: "'Segoe UI', sans-serif" }}>

      <header style={{ background: '#0d1117', borderBottom: '1px solid #1e2d40', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>
          Crypto Market Monitor — Real-Time Pipeline
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#1a3a1a', color: '#00ff88', border: '1px solid #00ff88' }}>Binance</span>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#1a1a3a', color: '#6af', border: '1px solid #6af' }}>Coinbase</span>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: connected ? '#00ff88' : '#f33', color: '#000', animation: connected ? 'pulse 1.5s infinite' : 'none' }}>
            {connected ? '● LIVE' : '● OFFLINE'}
          </span>
        </div>
      </header>

      <Ticker prices={prices} />
      <KpiGrid prices={prices} trades={trades} alerts={alerts} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', padding: '0 24px 16px' }}>
        <PriceChart tradesBySymbol={tradesBySymbol} />
        <TradesFeed trades={trades} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '0 24px 24px' }}>
        <AlertsList alerts={alerts} />
        <VolumeStats stats={stats} />
        <SystemHealth connected={connected} trades={trades} socket={socket} />
      </div>

      <footer style={{ background: '#0d1117', borderTop: '1px solid #1e2d40', padding: '8px 24px', fontSize: '11px', color: '#444', display: 'flex', gap: '16px' }}>
        <span>Kafka topics: <b>btcusdt · ethusdt · coinbase · alerts</b></span>
        <span>Node.js · Socket.IO · Kafka · Redis · MongoDB · React · Recharts</span>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1e2d40; border-radius: 2px; }
      `}</style>
    </div>
  )
}