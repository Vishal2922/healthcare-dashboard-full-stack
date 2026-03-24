import { useEffect, useState }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled                   from 'styled-components';
import {
  updateIdleTimeoutRequest,
  clearSuccess,
  clearError,
  selectIdleTimeoutMinutes,
  selectIdleSettingsSaving,
  selectIdleSettingsError,
  selectIdleSettingsSuccess,
} from '../../modules/idleSettings/idleSettingsSlice';
import { selectIsAdmin } from '../../modules/auth/selectors';

/* ── Styled components (matches your existing DM Sans / #0e1b2a theme) ─── */

const Page = styled.div`
  padding: 32px 24px;
  max-width: 640px;
  font-family: 'DM Sans', sans-serif;
`;

const PageTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #0e1b2a;
  margin: 0 0 4px;
`;

const PageSub = styled.p`
  font-size: 14px;
  color: #718096;
  margin: 0 0 28px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e8edf2;
  box-shadow: 0 2px 8px rgba(14,27,42,0.06);
  padding: 28px;
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #0e1b2a;
  margin-bottom: 8px;
`;

const CardDesc = styled.p`
  font-size: 13.5px;
  color: #718096;
  line-height: 1.65;
  margin: 0 0 24px;
`;

const CurrentBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  color: #0369a1;
  font-weight: 500;
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
`;

const PresetBtn = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid ${({ $active }) => ($active ? '#0e1b2a' : '#e2e8f0')};
  background: ${({ $active }) => ($active ? '#0e1b2a' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#4a5568')};
  &:hover {
    border-color: #0e1b2a;
    color: ${({ $active }) => ($active ? '#fff' : '#0e1b2a')};
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`;

const NumberInput = styled.input`
  width: 90px;
  height: 40px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #0e1b2a;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: #0e1b2a; }
`;

const Unit = styled.span`
  font-size: 14px;
  color: #718096;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 0 0 20px;
`;

const SaveBtn = styled.button`
  height: 42px;
  padding: 0 28px;
  border-radius: 10px;
  border: none;
  background: ${({ disabled }) => (disabled ? '#e2e8f0' : '#0e1b2a')};
  color: ${({ disabled }) => (disabled ? '#a0aec0' : '#fff')};
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #1a2d43; }
`;

const Banner = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  margin-bottom: 16px;
  background: ${({ $type }) => ($type === 'success' ? '#f0fdf4' : '#fff5f5')};
  border: 1px solid ${({ $type }) => ($type === 'success' ? '#bbf7d0' : '#fecaca')};
  color: ${({ $type }) => ($type === 'success' ? '#166534' : '#991b1b')};
`;

const AccessDenied = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: #718096;
  font-size: 15px;
`;

/* ── Presets ──────────────────────────────────────────────────────────────── */
const PRESETS = [
  { label: '3 min',  value: 3  },
  { label: '5 min',  value: 5  },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

/* ── Component ────────────────────────────────────────────────────────────── */
export default function SecuritySettings() {
  const dispatch       = useDispatch();
  const isAdmin        = useSelector(selectIsAdmin);
  const savedMinutes   = useSelector(selectIdleTimeoutMinutes);
  const saving         = useSelector(selectIdleSettingsSaving);
  const error          = useSelector(selectIdleSettingsError);
  const successMessage = useSelector(selectIdleSettingsSuccess);

  const [value, setValue] = useState(savedMinutes);

  // Sync local value when Redux rehydrates (page refresh)
  useEffect(() => {
    setValue(savedMinutes);
  }, [savedMinutes]);

  // Auto-clear success banner after 3s
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  // Auto-clear error banner after 5s
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  if (!isAdmin) {
    return (
      <AccessDenied>
        🔒 Only administrators can view and modify security settings.
      </AccessDenied>
    );
  }

  const noChange   = value === savedMinutes;
  const outOfRange = !value || value < 1 || value > 480;

  return (
    <Page>
      <PageTitle>🔒 Security Settings</PageTitle>
      <PageSub>Configure system-wide security policies for all users.</PageSub>

      <Card>
        <CardTitle>
          <span>⏱</span>
          Idle Logout Timeout
        </CardTitle>
        <CardDesc>
          All users are automatically logged out after this many minutes of
          inactivity. A <strong>60-second warning</strong> appears before logout
          so users can extend their session. Applies to every role.
        </CardDesc>

        {/* Current value badge */}
        <CurrentBadge>
          ✅ Currently active: <strong>{savedMinutes} minute{savedMinutes !== 1 ? 's' : ''}</strong>
          &nbsp;— users warned 60s before logout
        </CurrentBadge>

        {/* Banners */}
        {successMessage && <Banner $type="success">✅ {successMessage}</Banner>}
        {error          && <Banner $type="error">⚠️ {error}</Banner>}

        {/* Quick presets */}
        <Label>Quick Select</Label>
        <PresetRow>
          {PRESETS.map((p) => (
            <PresetBtn
              key={p.value}
              $active={value === p.value}
              onClick={() => setValue(p.value)}
              type="button"
            >
              {p.label}
            </PresetBtn>
          ))}
        </PresetRow>

        <Divider />

        {/* Custom input */}
        <Label>Custom Value</Label>
        <InputRow>
          <NumberInput
            type="number"
            min={1}
            max={480}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <Unit>minutes &nbsp;(1 – 480)</Unit>
        </InputRow>

        {/* Save */}
        <SaveBtn
          disabled={saving || noChange || outOfRange}
          onClick={() => dispatch(updateIdleTimeoutRequest(value))}
          type="button"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </SaveBtn>

        {noChange && !saving && (
          <span style={{ marginLeft: 12, fontSize: 12, color: '#a0aec0' }}>
            No changes to save
          </span>
        )}
      </Card>
    </Page>
  );
}