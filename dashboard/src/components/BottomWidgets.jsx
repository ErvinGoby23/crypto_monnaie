//  Alertes temps réel 
export function AlertsList({ alerts }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        Alertes temps réel
      </div>

      {alerts.length === 0 ? (
        <p style={{ color: '#444', fontSize: '12px' }}>Aucune alerte</p>
      ) : (
        alerts.slice(0, 5).map((alert, i) => (
          <div key={i} style={{
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '8px',
            fontSize: '12px',
            borderLeft: `3px solid ${alert.type === 'BIG_VOLUME' ? '#f90' : '#f33'}`,
            background: alert.type === 'BIG_VOLUME' ? '#1a1200' : '#1a0000',
            color: alert.type === 'BIG_VOLUME' ? '#f90' : '#f66'
          }}>
            {alert.message}<br />
            <span style={{ opacity: 0.6 }}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

// Volume par fenêtre 
export function VolumeStats({ stats }) {
  const btcStats = stats['BTCUSDT'] || {}
  const windows  = ['1min', '5min', '15min', '1h']
  const maxVol   = Math.max(...windows.map(w => btcStats[w]?.totalVolume || 0), 1)

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        📊 Volume par fenêtre (BTC)
      </div>

      {windows.map(w => {
        const vol = btcStats[w]?.totalVolume || 0
        const pct = (vol / maxVol * 100).toFixed(0)
        return (
          <div key={w} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px' }}>
            <span style={{ width: '35px', color: '#666' }}>{w}</span>
            <div style={{ flex: 1, height: '8px', background: '#1a1a2e', borderRadius: '4px' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#00ff88', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
            <span style={{ width: '70px', color: '#00ff88', textAlign: 'right' }}>{vol.toFixed(3)} BTC</span>
          </div>
        )
      })}
    </div>
  )
}


export function SystemHealth({ connected, trades }) {
  const items = [
    { label: 'WebSocket Binance',  status: '● connecté', color: '#00ff88' },
    { label: 'WebSocket Coinbase', status: '● connecté', color: '#6af' },
    { label: 'Kafka broker',       status: '● actif',    color: '#00ff88' },
    { label: 'Redis buffer',       status: '● actif',    color: '#00ff88' },
    { label: 'MongoDB',            status: '● connecté', color: '#00ff88' },
    { label: 'Consumer group',     status: '3 / 3 actifs', color: '#00ff88' },
    {
      label: 'API Server',
      status: connected ? '● connecté' : '● déconnecté',
      color: connected ? '#00ff88' : '#f33'
    },
    { label: 'Trades reçus', status: trades.length, color: '#00ff88' }
  ]

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        Pipeline — Santé système
      </div>

      {items.map(({ label, status, color }) => (
        <div key={label} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 0',
          borderBottom: '1px solid #1a1a2e',
          fontSize: '13px'
        }}>
          <span style={{ color: '#aaa' }}>{label}</span>
          <span style={{ color }}>{status}</span>
        </div>
      ))}
    </div>
  )
}
