import { useState, useEffect } from 'react'

function Dot({ ok, label }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: '13px'
    }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ color: ok ? '#00ff88' : '#f33' }}>
        {ok ? '● actif' : '● inactif'}
      </span>
    </div>
  )
}

export function SystemHealth({ connected, trades, socket }) {
  const [health, setHealth] = useState({
    mongodb: false,
    kafka: false,
    consumers: 0,
    tradesPerSec: 0,
    lastTradeAt: null
  })

  useEffect(() => {
    if (!socket) return
    socket.on('health', (data) => setHealth(data))
    return () => socket.off('health')
  }, [socket])

  const lagSeconds = health.lastTradeAt
    ? Math.round((Date.now() - new Date(health.lastTradeAt).getTime()) / 1000)
    : null

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        🖥 Pipeline — Santé système
      </div>

      <Dot ok={connected}         label="API Server (Socket.IO)" />
      <Dot ok={health.mongodb}    label="MongoDB" />
      <Dot ok={health.kafka}      label="Kafka broker" />
      <Dot ok={health.consumers > 0} label={`Consumer group (${health.consumers}/3)`} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: '13px' }}>
        <span style={{ color: '#aaa' }}>Trades / sec</span>
        <span style={{ color: '#00ff88' }}>{health.tradesPerSec}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: '13px' }}>
        <span style={{ color: '#aaa' }}>Dernier trade</span>
        <span style={{ color: lagSeconds !== null && lagSeconds < 5 ? '#00ff88' : '#f90' }}>
          {lagSeconds !== null ? `il y a ${lagSeconds}s` : '--'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
        <span style={{ color: '#aaa' }}>Trades reçus</span>
        <span style={{ color: '#00ff88' }}>{trades.length}</span>
      </div>
    </div>
  )
}