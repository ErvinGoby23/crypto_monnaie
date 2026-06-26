export function VolumeStats({ stats }) {
  const btcStats = stats['BTCUSDT'] || {}
  const windows  = ['1min', '5min', '15min', '1h']
  const maxVol   = Math.max(...windows.map(w => btcStats[w]?.totalVolume || 0), 1)

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '12px' }}>
        Volume par fenêtre (BTC)
      </div>

      {windows.map(w => {
        const vol = btcStats[w]?.totalVolume || 0
        const pct = (vol / maxVol * 100).toFixed(0)
        return (
          <div key={w} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px' }}>
            <span style={{ width: '35px', color: '#666' }}>{w}</span>
            <div style={{ flex: 1, height: '8px', background: '#1a1a2e', borderRadius: '4px' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: '#00ff88',
                borderRadius: '4px',
                transition: 'width 0.5s'
              }} />
            </div>
            <span style={{ width: '70px', color: '#00ff88', textAlign: 'right' }}>
              {vol.toFixed(3)} BTC
            </span>
          </div>
        )
      })}
    </div>
  )
}