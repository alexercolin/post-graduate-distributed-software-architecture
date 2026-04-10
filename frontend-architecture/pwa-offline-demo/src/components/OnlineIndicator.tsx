import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OnlineIndicator() {
  const { isOnline } = useOnlineStatus();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: isOnline ? 'rgba(0, 200, 83, 0.15)' : 'rgba(233, 69, 96, 0.15)',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#00c853' : '#e94560',
          boxShadow: isOnline ? '0 0 6px #00c853' : '0 0 6px #e94560',
        }}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}
