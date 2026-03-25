import { useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  CheckOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  BellOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

/* ═══════════════════════════════════════════════════════════════
   NotificationDropdown — absolute-positioned under the bell icon.
   ═══════════════════════════════════════════════════════════════ */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  z-index: 299;
`;

const Panel = styled.div`
  position: absolute;
  top: 54px; right: 0;
  width: 380px;
  max-height: 480px;
  background: ${({ theme }) => theme?.colors?.surface || '#fff'};
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  z-index: 300;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.18s ease;
  font-family: 'DM Sans', sans-serif;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border || '#f0f0f0'};
`;

const Title = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
`;

const MarkAllBtn = styled.button`
  background: none; border: none;
  font-size: 12px; font-weight: 600;
  color: #3182ce; cursor: pointer;
  padding: 4px 8px; border-radius: 6px;
  transition: background 0.15s;
  &:hover { background: #ebf8ff; }
  &:disabled { color: #a0aec0; cursor: default; &:hover { background: none; } }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #a0aec0;
  font-size: 13px;
  gap: 10px;
`;

const Item = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border || '#fafafa'};
  background: ${({ theme, $unread }) => $unread ? (theme?.colors?.primary ? `${theme.colors.primary}15` : '#f0f9ff') : 'transparent'};
  transition: background 0.12s;
  cursor: pointer;
  &:hover { background: ${({ theme, $unread }) => $unread ? (theme?.colors?.primary ? `${theme.colors.primary}25` : '#e6f4ff') : (theme?.colors?.background || '#f7fafc')}; }
`;

const Dot = styled.div`
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #3182ce;
  margin-top: 6px;
  flex-shrink: 0;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  font-size: 13px;
  font-weight: ${({ $unread }) => ($unread ? 700 : 500)};
  color: ${({ theme }) => theme?.colors?.text || '#1a202c'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemMsg = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary || '#718096'};
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ItemTime = styled.div`
  font-size: 11px;
  color: #a0aec0;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
`;

const IconBtn = styled.button`
  background: none; border: none;
  color: #a0aec0; font-size: 13px;
  cursor: pointer; padding: 3px;
  border-radius: 4px;
  transition: color 0.12s, background 0.12s;
  display: flex; align-items: center;
  &:hover { color: ${({ $danger }) => ($danger ? '#e53e3e' : '#3182ce')}; background: ${({ $danger }) => ($danger ? '#fff5f5' : '#ebf8ff')}; }
`;

const TypeBadge = styled.span`
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-right: 6px;
  background: ${({ $type }) =>
    $type === 'appointment_alert' ? '#ebf8ff' :
    $type === 'payment_alert'     ? '#fffff0' :
                                    '#f0fff4'};
  color: ${({ $type }) =>
    $type === 'appointment_alert' ? '#2b6cb0' :
    $type === 'payment_alert'     ? '#975a16' :
                                    '#276749'};
`;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  loading,
  markAllLoading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose,
  isMarking,
  isDeleting,
}) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <Overlay onClick={onClose} />
      <Panel ref={panelRef}>
        {/* Header */}
        <Head>
          <Title>
            Notifications
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3182ce', marginLeft: 8 }}>
                {unreadCount} new
              </span>
            )}
          </Title>
          {unreadCount > 0 && (
            <MarkAllBtn onClick={onMarkAllRead} disabled={markAllLoading}>
              <CheckCircleOutlined style={{ marginRight: 4 }} />
              {markAllLoading ? 'Marking…' : 'Mark all read'}
            </MarkAllBtn>
          )}
        </Head>

        {/* List */}
        <List>
          {loading && notifications.length === 0 ? (
            <EmptyState>Loading notifications…</EmptyState>
          ) : notifications.length === 0 ? (
            <EmptyState>
              <BellOutlined style={{ fontSize: 28, color: '#cbd5e0' }} />
              <span>No notifications yet</span>
              <span style={{ fontSize: 11, color: '#cbd5e0' }}>
                You'll be notified about appointments, payments & more
              </span>
            </EmptyState>
          ) : (
            notifications.map((n) => {
              const unread = !n.is_read;
              return (
                <Item key={n.id} $unread={unread} onClick={() => unread && onMarkRead(n.id)}>
                  <Dot $visible={unread} />
                  <ItemBody>
                    <ItemTitle $unread={unread}>
                      {n.type && n.type !== 'system' && <TypeBadge $type={n.type}>{n.type.replace('_', ' ')}</TypeBadge>}
                      {n.title}
                    </ItemTitle>
                    {n.message && <ItemMsg>{n.message}</ItemMsg>}
                    <ItemTime>
                      <ClockCircleOutlined style={{ fontSize: 10 }} />
                      {timeAgo(n.created_at)}
                    </ItemTime>
                  </ItemBody>
                  <Actions>
                    {unread && (
                      <IconBtn
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                        disabled={isMarking?.(n.id)}
                      >
                        <CheckOutlined />
                      </IconBtn>
                    )}
                    <IconBtn
                      $danger
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                      disabled={isDeleting?.(n.id)}
                    >
                      <DeleteOutlined />
                    </IconBtn>
                  </Actions>
                </Item>
              );
            })
          )}
        </List>
      </Panel>
    </>
  );
}
