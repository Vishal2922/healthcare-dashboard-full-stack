import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  CloseOutlined,
  SendOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import useCommunicationNotes from '../../modules/communication/hooks/useCommunicationNotes';

/* ═══════════════════════════════════════════════════════════════
   AppointmentNotesDrawer — Slide-out drawer from the right
   for viewing/creating/deleting encrypted appointment notes.
   ═══════════════════════════════════════════════════════════════ */

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 400;
  animation: fadeIn 0.15s ease;
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const Drawer = styled.div`
  position: fixed;
  top: 0; right: 0;
  width: 440px;
  max-width: 100vw;
  height: 100vh;
  background: #fff;
  z-index: 401;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 30px rgba(0,0,0,0.12);
  animation: ${slideIn} 0.22s ease;
  font-family: 'DM Sans', sans-serif;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
`;

const DrawerTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseBtn = styled.button`
  background: none; border: none;
  color: #a0aec0; font-size: 16px;
  cursor: pointer; padding: 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  display: flex; align-items: center;
  &:hover { color: #e53e3e; background: #fff5f5; }
`;

const NotesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

const EmptyNotes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #a0aec0;
  font-size: 13px;
  gap: 10px;
`;

const NoteCard = styled.div`
  background: ${({ $own }) => ($own ? '#f0f9ff' : '#f7fafc')};
  border: 1px solid ${({ $own }) => ($own ? '#bee3f8' : '#edf2f7')};
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  position: relative;
  transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
`;

const NoteMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NoteAuthor = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #2d3748;
`;

const NoteTypeBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${({ $type }) =>
    $type === 'clinical'      ? '#faf5ff' :
    $type === 'provider_only' ? '#fff5f5' :
    $type === 'nurse'         ? '#fffff0' :
                                '#f0fff4'};
  color: ${({ $type }) =>
    $type === 'clinical'      ? '#553c9a' :
    $type === 'provider_only' ? '#c53030' :
    $type === 'nurse'         ? '#975a16' :
                                '#276749'};
`;

const NoteBody = styled.div`
  font-size: 13px;
  color: #2d3748;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const NoteTime = styled.div`
  font-size: 11px;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
`;

const NoteDeleteBtn = styled.button`
  background: none; border: none;
  color: #cbd5e0; font-size: 12px;
  cursor: pointer; padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.12s, background 0.12s;
  &:hover { color: #e53e3e; background: #fff5f5; }
`;

const InputArea = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 16px 24px;
  background: #fafbfc;
`;

const TypeSelector = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`;

const TypeChip = styled.button`
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? '#3182ce' : '#e2e8f0')};
  background: ${({ $active }) => ($active ? '#ebf8ff' : '#fff')};
  color: ${({ $active }) => ($active ? '#2b6cb0' : '#718096')};
  cursor: pointer;
  transition: all 0.12s;
  &:hover { border-color: #3182ce; }
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
`;

const TextInput = styled.textarea`
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  resize: none;
  min-height: 44px;
  max-height: 100px;
  color: #2d3748;
  transition: border-color 0.15s;
  &:focus { outline: none; border-color: #3182ce; }
  &::placeholder { color: #cbd5e0; }
`;

const SendBtn = styled.button`
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 8px;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
  &:hover { background: #2b6cb0; }
  &:disabled { background: #a0aec0; cursor: not-allowed; }
`;

const NOTE_TYPES = [
  { key: 'note',          label: 'General' },
  { key: 'clinical',      label: 'Clinical' },
  { key: 'provider_only', label: 'Provider Only' },
  { key: 'nurse',         label: 'Nurse' },
];

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentNotesDrawer({ appointmentId, onClose }) {
  const {
    notes, loading, createLoading, loadNotes, sendNote, removeNote, isDeleting,
  } = useCommunicationNotes();

  const [message, setMessage]   = useState('');
  const [noteType, setNoteType] = useState('note');
  const listRef = useRef(null);

  // Load notes on mount
  useEffect(() => {
    if (appointmentId) loadNotes(appointmentId);
  }, [appointmentId]); // eslint-disable-line

  // Scroll to bottom when notes change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes.length]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || createLoading) return;
    sendNote({ appointmentId, message: trimmed, note_type: noteType });
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Drawer>
        {/* Header */}
        <DrawerHeader>
          <DrawerTitle>
            <FileTextOutlined style={{ color: '#3182ce' }} />
            Appointment Notes
            <span style={{ fontSize: 12, fontWeight: 500, color: '#a0aec0' }}>
              #{appointmentId}
            </span>
          </DrawerTitle>
          <CloseBtn onClick={onClose} title="Close">
            <CloseOutlined />
          </CloseBtn>
        </DrawerHeader>

        {/* Notes List */}
        <NotesList ref={listRef}>
          {loading ? (
            <EmptyNotes>Loading notes…</EmptyNotes>
          ) : notes.length === 0 ? (
            <EmptyNotes>
              <FileTextOutlined style={{ fontSize: 28, color: '#cbd5e0' }} />
              <span>No notes yet</span>
              <span style={{ fontSize: 11, color: '#cbd5e0' }}>
                Send the first note for this appointment
              </span>
            </EmptyNotes>
          ) : (
            notes.map((note) => (
              <NoteCard key={note.id}>
                <NoteMeta>
                  <NoteAuthor>
                    <UserOutlined style={{ fontSize: 11 }} />
                    {note.author_name || 'Unknown'}
                    {note.author_role && (
                      <span style={{ fontWeight: 400, color: '#a0aec0' }}>
                        ({note.author_role})
                      </span>
                    )}
                  </NoteAuthor>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {note.note_type && note.note_type !== 'note' && (
                      <NoteTypeBadge $type={note.note_type}>
                        {note.note_type.replace('_', ' ')}
                      </NoteTypeBadge>
                    )}
                    <NoteDeleteBtn
                      onClick={() => removeNote(note.id)}
                      disabled={isDeleting(note.id)}
                      title="Delete note"
                    >
                      <DeleteOutlined />
                    </NoteDeleteBtn>
                  </div>
                </NoteMeta>
                <NoteBody>{note.message}</NoteBody>
                <NoteTime>
                  <ClockCircleOutlined style={{ fontSize: 10 }} />
                  {formatTime(note.created_at)}
                </NoteTime>
              </NoteCard>
            ))
          )}
        </NotesList>

        {/* Input Area */}
        <InputArea>
          <TypeSelector>
            {NOTE_TYPES.map(({ key, label }) => (
              <TypeChip
                key={key}
                $active={noteType === key}
                onClick={() => setNoteType(key)}
              >
                {label}
              </TypeChip>
            ))}
          </TypeSelector>
          <InputRow>
            <TextInput
              placeholder="Type a note… (Enter to send, Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <SendBtn
              onClick={handleSend}
              disabled={!message.trim() || createLoading}
              title="Send note"
            >
              <SendOutlined />
            </SendBtn>
          </InputRow>
        </InputArea>
      </Drawer>
    </>
  );
}
