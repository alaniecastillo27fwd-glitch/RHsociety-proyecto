export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  alert = false,
  badgeText = null,
}) {
  const variantStyles = {
    primary: {
      borderLeft: '4px solid var(--meadow-green)',
      iconBg: 'var(--peach-light)',
      iconColor: 'var(--meadow-green)',
      borderColor: 'var(--meadow-green)',
    },
    success: {
      borderLeft: '4px solid var(--mustard-green)',
      iconBg: 'var(--peach-subtle)',
      iconColor: 'var(--mustard-green-dark)',
      borderColor: 'var(--mustard-green)',
    },
    warning: {
      borderLeft: '4px solid var(--mustard-green)',
      iconBg: 'var(--peach-light)',
      iconColor: 'var(--mustard-green)',
      borderColor: 'var(--mustard-green)',
    },
    danger: {
      borderLeft: '4px solid var(--crimson)',
      iconBg: 'var(--crimson-light)',
      iconColor: 'var(--crimson)',
      borderColor: 'var(--crimson)',
    },
    info: {
      borderLeft: '4px solid var(--meadow-green)',
      iconBg: 'var(--peach-light)',
      iconColor: 'var(--meadow-green)',
      borderColor: 'var(--meadow-green)',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <div
      className="card card-interactive"
      style={{
        borderLeft: currentVariant.borderLeft,
        borderTop: '1.5px solid var(--border-color)',
        borderRight: '1.5px solid var(--border-color)',
        borderBottom: '1.5px solid var(--border-color)',
        borderRadius: '4px',
        padding: '1.15rem 1.25rem',
        backgroundColor: 'var(--bg-card)',
        position: 'relative',
        minHeight: '125px',
        justifyContent: 'space-between',
        boxShadow: '3px 3px 0px rgba(12, 96, 56, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '2.1rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginTop: '0.2rem',
            lineHeight: 1.1,
            fontFamily: 'Cormorant Garamond, Georgia, serif',
          }}>
            {value !== undefined && value !== null ? value : '--'}
          </div>
        </div>

        {Icon && (
          <div
            style={{
              backgroundColor: currentVariant.iconBg,
              color: currentVariant.iconColor,
              border: `1.5px solid ${currentVariant.borderColor}`,
              padding: '0.65rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        {subtitle && (
          <div
            style={{
              fontSize: '0.775rem',
              color: alert ? 'var(--crimson)' : 'var(--text-muted)',
              fontWeight: alert ? 700 : 500,
            }}
          >
            {subtitle}
          </div>
        )}

        {badgeText && (
          <span
            className={`badge ${alert ? 'badge-crimson' : 'badge-mustard'}`}
            style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
