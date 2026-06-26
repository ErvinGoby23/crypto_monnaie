import { useMemo, useRef } from 'react'

function KpiCard({ title, value, sub, subColor = '#00ff88' }) {
  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #1e2d40',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: subColor, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export function KpiGrid({ prices, trades, alerts }) {
  const firstPrices = useRef({})
  const tpsRef      = useRef(0)

  // Calcul variation BTC
  if (prices.BTCUSDT && !firstPrices.current.BTCUSDT) {
    firstPrices.current.BTCUSDT = prices.BTCUSDT
  }
  if (prices.ETHUSDT && !firstPrices.current.ETHUSDT) {
    firstPrices.current.ETHUSDT = prices.ETHUSDT
  }

  const btcChange = useMemo(() => {
    if (!prices.BTCUSDT || !firstPrices.current.BTCUSDT) return null
    return ((prices.BTCUSDT - firstPrices.current.BTCUSDT) / firstPrices.current.BTCUSDT * 100).toFixed(2)
  }, [prices.BTCUSDT])

  const ethChange = useMemo(() => {
    if (!prices.ETHUSDT || !firstPrices.current.ETHUSDT) return null
    return ((prices.ETHUSDT - firstPrices.current.ETHUSDT) / firstPrices.current.ETHUSDT * 100).toFixed(2)
  }, [prices.ETHUSDT])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      padding: '16px 24px'
    }}>
      <KpiCard
        title="BTC/USDT — Prix actuel"
        value={prices.BTCUSDT ? `$${prices.BTCUSDT.toLocaleString()}` : '--'}
        sub={btcChange ? `${btcChange > 0 ? '▲' : '▼'} ${btcChange}% depuis début` : '--'}
        subColor={btcChange > 0 ? '#00ff88' : '#f33'}
      />
      <KpiCard
        title="ETH/USDT — Prix actuel"
        value={prices.ETHUSDT ? `$${prices.ETHUSDT.toLocaleString()}` : '--'}
        sub={ethChange ? `${ethChange > 0 ? '▲' : '▼'} ${ethChange}% depuis début` : '--'}
        subColor={ethChange > 0 ? '#00ff88' : '#f33'}
      />
      <KpiCard
        title="Trades reçus"
        value={trades.length}
        sub="depuis connexion"
      />
      <KpiCard
        title="Anomalies détectées"
        value={alerts.length}
        sub="depuis démarrage"
        subColor="#f90"
      />
    </div>
  )
}
