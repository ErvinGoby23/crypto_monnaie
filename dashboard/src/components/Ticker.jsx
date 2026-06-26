export function Ticker({ prices }) {
  const items = [
    { label: 'BTC/USDT',        key: 'BTCUSDT',  color: '#00ff88' },
    { label: 'ETH/USDT',        key: 'ETHUSDT',  color: '#f90' },
    { label: 'BTC-USD Coinbase', key: 'BTC-USD', color: '#6af' },
  ]

  return (
    <div style={{
      background: '#0d1117',
      borderBottom: '1px solid #1e2d40',
      padding: '8px 24px',
      display: 'flex',
      gap: '32px',
      fontSize: '13px'
    }}>
      {items.map(({ label, key, color }) => (
        <div key={key}>
          <span style={{ color: '#555', marginRight: '8px' }}>{label}</span>
          <span style={{ color, fontWeight: 'bold' }}>
            {prices[key] ? `$${prices[key].toLocaleString()}` : '--'}
          </span>
        </div>
      ))}
    </div>
  )
}