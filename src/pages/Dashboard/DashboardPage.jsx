import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

import useAuth from '../../modules/auth/hooks/useAuth';
import axiosClient from '../../services/axiosClient';

/* ── animations ── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── styled ── */
const Page = styled.div`
  animation: ${fadeUp} 0.4s ease both;
`;

const Greeting = styled.h1`
  font-family: 'DM Sans', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #0e1b2a;
  margin: 0 0 4px;
`;

const Sub = styled.p`
  font-size: 14px;
  color: #7a8694;
  margin: 0 0 32px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 22px 24px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a0aab4;
`;

const IconWrap = styled.div`
  width: 36px; height: 36px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg || '#f0fdf9'};
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  color: ${({ $color }) => $color || '#20b486'};
`;

const CardValue = styled.div`
  font-size: 30px;
  font-weight: 800;
  color: #0e1b2a;
  line-height: 1;
`;

const CardNote = styled.div`
  font-size: 12px;
  color: #a0aab4;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #0e1b2a;
  margin: 0 0 16px;
`;

const RecentTable = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  overflow: hidden;
`;

const THead = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  padding: 11px 20px;
  background: #f7fafc;
  border-bottom: 1px solid #edf2f7;
`;

const TH = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #718096;
`;

const TRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  padding: 12px 20px;
  border-bottom: 1px solid #f7fafc;
  align-items: center;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafafa; }
`;

const TD = styled.div`
  font-size: 13px;
  color: ${({ $muted }) => ($muted ? '#a0aab4' : '#2d3748')};
  font-weight: ${({ $bold }) => ($bold ? 600 : 400)};
`;

const StatusPill = styled.span`
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ $status }) => STATUS_BG[$status] || '#f7fafc'};
  color: ${({ $status }) => STATUS_COLOR[$status] || '#718096'};
`;

const Empty = styled.div`
  padding: 48px;
  text-align: center;
  color: #a0aab4;
  font-size: 14px;
`;

const LoadingRow = styled.div`
  padding: 32px;
  text-align: center;
  color: #a0aab4;
  font-size: 14px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

/* ── status colours ── */
const STATUS_BG = {
  scheduled:         '#ebf8ff',
  arrived:           '#fffff0',
  'in-consultation': '#faf5ff',
  completed:         '#f0fff4',
  cancelled:         '#fff5f5',
  pending:           '#fff3cd',
  paid:              '#f0fff4',
  overdue:           '#fff5f5',
};
const STATUS_COLOR = {
  scheduled:         '#2b6cb0',
  arrived:           '#975a16',
  'in-consultation': '#553c9a',
  completed:         '#276749',
  cancelled:         '#c53030',
  pending:           '#856404',
  paid:              '#276749',
  overdue:           '#c53030',
};

/* ── helpers ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrency(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ── component ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    axiosClient.get('/api/dashboard/stats')
      .then((r) => {
        // Backend response shape:
        // { status, message, data: { stats: { total_patients, pending_prescriptions, upcoming_appointments }, accessed_by } }
        const payload = r.data?.data ?? r.data;
        const s = payload?.stats ?? payload;
        setStats(s);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const CARDS = stats
    ? [
        {
          label: 'Total Patients',
          value: stats.total_patients ?? '—',
          note: 'Registered patients',
          Icon: TeamOutlined,
          iconBg: '#ebf8ff', iconColor: '#2b6cb0',
        },
        {
          label: 'Upcoming Appointments',
          value: stats.upcoming_appointments ?? '—',
          note: 'Scheduled & awaiting',
          Icon: CalendarOutlined,
          iconBg: '#faf5ff', iconColor: '#805ad5',
        },
        {
          label: 'Pending Prescriptions',
          value: stats.pending_prescriptions ?? '—',
          note: 'Awaiting dispensing',
          Icon: ExclamationCircleOutlined,
          iconBg: '#fff3cd', iconColor: '#856404',
        },
        {
          label: 'Active Staff',
          value: stats.active_staff ?? '—',
          note: 'Across all roles',
          Icon: RiseOutlined,
          iconBg: '#f0fff4', iconColor: '#20b486',
        },
      ]
    : [];

  const recentAppointments = stats?.recent_appointments ?? [];
  const recentInvoices     = stats?.recent_invoices ?? [];

  return (
    <Page>
        <Greeting>{greeting()}, {user?.username} 👋</Greeting>
        <Sub>Here's what's happening at your clinic today.</Sub>

        {/* Stat cards */}
        {loading ? (
          <Grid>
            {[1,2,3,4].map((i) => (
              <Card key={i} style={{ minHeight: 110, opacity: 0.5 }}>
                <CardTop><CardLabel>Loading…</CardLabel></CardTop>
                <CardValue>—</CardValue>
              </Card>
            ))}
          </Grid>
        ) : error ? (
          <Card style={{ marginBottom: 32, color: '#c53030', fontSize: 14 }}>
            ⚠️ Could not load dashboard stats. Please check your connection.
          </Card>
        ) : (
          <Grid>
            {CARDS.map(({ label, value, note, Icon, iconBg, iconColor }) => (
              <Card key={label}>
                <CardTop>
                  <CardLabel>{label}</CardLabel>
                  <IconWrap $bg={iconBg} $color={iconColor}><Icon /></IconWrap>
                </CardTop>
                <CardValue>{value}</CardValue>
                <CardNote>{note}</CardNote>
              </Card>
            ))}
          </Grid>
        )}

        {/* Recent rows */}
        {!loading && !error && (
          <TwoCol>
            {/* Recent Appointments */}
            <div>
              <SectionTitle>Recent Appointments</SectionTitle>
              <RecentTable>
                <THead>
                  <TH>Patient</TH>
                  <TH>Doctor</TH>
                  <TH>Time</TH>
                  <TH>Status</TH>
                </THead>
                {recentAppointments.length === 0 ? (
                  <Empty>No recent appointments.</Empty>
                ) : (
                  recentAppointments.slice(0, 6).map((a) => (
                    <TRow key={a.id}>
                      <TD $bold>{a.patient_name || `#${a.patient_id}`}</TD>
                      <TD $muted>{a.doctor_name || `#${a.doctor_id}`}</TD>
                      <TD $muted>{formatTime(a.appointment_time)}</TD>
                      <TD><StatusPill $status={a.status}>{a.status}</StatusPill></TD>
                    </TRow>
                  ))
                )}
              </RecentTable>
            </div>

            {/* Recent Invoices */}
            <div>
              <SectionTitle>Recent Invoices</SectionTitle>
              <RecentTable>
                <THead>
                  <TH>Invoice</TH>
                  <TH>Patient</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                </THead>
                {recentInvoices.length === 0 ? (
                  <Empty>No recent invoices.</Empty>
                ) : (
                  recentInvoices.slice(0, 6).map((inv) => (
                    <TRow key={inv.id}>
                      <TD $bold>#{inv.id}</TD>
                      <TD $muted>{inv.patient_name || '—'}</TD>
                      <TD>{formatCurrency(inv.amount)}</TD>
                      <TD><StatusPill $status={inv.status}>{inv.status}</StatusPill></TD>
                    </TRow>
                  ))
                )}
              </RecentTable>
            </div>
          </TwoCol>
        )}
    </Page>
  );
}