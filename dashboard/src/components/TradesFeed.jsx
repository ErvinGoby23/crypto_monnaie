export function TradesFeed({ trades }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        Trades récents — Live feed
      </div>

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {trades.slice(0, 25).map((trade, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #1a1a2e',
            fontSize: '12px'
          }}>
            <span style={{
              fontWeight: 'bold',
              color: trade.source === 'binance' ? '#00ff88' : '#6af'
            }}>
              ${trade.price?.toLocaleString()}
            </span>
            <span style={{ color: '#666' }}>{trade.quantity?.toFixed(4)}</span>
            <span style={{ color: '#444', fontSize: '10px' }}>
              {trade.source} · {trade.symbol}
            </span>
            <span style={{ color: '#333', fontSize: '11px' }}>
              {new Date(trade.receivedAt || trade.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}