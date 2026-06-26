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