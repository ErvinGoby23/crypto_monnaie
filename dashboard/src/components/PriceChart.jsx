import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const SYMBOLS = [
  { key: 'BTCUSDT',  label: 'BTC/USDT',     color: '#00ff88' },
  { key: 'ETHUSDT',  label: 'ETH/USDT',     color: '#f90' },
  { key: 'BTC-USD',  label: 'BTC Coinbase', color: '#6af' },
]

function SingleChart({ symbol, label, color, trades }) {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const symbolTrades = trades[symbol] || []
    setChartData(
      [...symbolTrades]
        .reverse()
        .map(t => ({
          time: new Date(t.receivedAt || t.timestamp).toLocaleTimeString(),
          price: parseFloat(t.price)
        }))
        .filter(t => t.price > 0)
    )
  }, [trades, symbol])

  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${color}33`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{ fontSize: '12px', color, textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
        analyse {label}
      </div>

      {chartData.length === 0 ? (
        <div style={{ color: '#444', fontSize: '12px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          En attente de données...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
            <XAxis dataKey="time" tick={{ fill: '#444', fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#444', fontSize: 9 }} domain={['auto', 'auto']} width={70} />
            <Tooltip
              contentStyle={{ background: '#0d1117', border: `1px solid ${color}`, color: '#fff', fontSize: '11px' }}
              formatter={(v) => [`$${v.toLocaleString()}`, 'Prix']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function PriceChart({ tradesBySymbol }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d40', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', marginBottom: '16px' }}>
        Prix — Fenêtres glissantes
      </div>

      {SYMBOLS.map(({ key, label, color }) => (
        <SingleChart
          key={key}
          symbol={key}
          label={label}
          color={color}
          trades={tradesBySymbol}
        />
      ))}
    </div>
  )
}