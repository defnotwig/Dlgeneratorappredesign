export function Watermark() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 250px)',
          gridTemplateRows: 'repeat(auto-fill, 150px)',
          gap: '15px',
          transform: 'rotate(-45deg)',
        }}
      >
        {Array.from({ length: 150 }).map((_, index) => {
          // Alternating pattern: show watermark only on even indices
          const isVisible = index % 2 === 0;
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(0, 0, 0, 0.03)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                opacity: isVisible ? 1 : 0,
              }}
            >
              Gabriel Ludwig Rivera
            </div>
          );
        })}
      </div>
    </div>
  );
}