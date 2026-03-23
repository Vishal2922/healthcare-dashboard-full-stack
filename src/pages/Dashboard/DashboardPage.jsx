import { useEffect, useState } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import useAuth from '../../modules/auth/hooks/useAuth';
import axiosClient from '../../services/axiosClient';

/* ── Google Font ─────────────────────────────────────────────────────────────── */
const DashFont = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');
`;

/* ── Animations ──────────────────────────────────────────────────────────────── */
const rise = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

const countUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Design tokens ───────────────────────────────────────────────────────────── */
const T = {
  navy:    '#0a1628',
  navyMid: '#162035',
  slate:   '#4a5568',
  muted:   '#8896a8',
  border:  '#e8edf3',
  bg:      '#f5f7fa',
  white:   '#ffffff',
  accent:  '#20b486',
  accentL: '#e6f9f3',
  gold:    '#f59e0b',
  goldL:   '#fef3c7',
  rose:    '#f43f5e',
  roseL:   '#fef2f5',
  indigo:  '#6366f1',
  indigoL: '#eef2ff',
  sky:     '#0ea5e9',
  skyL:    '#f0f9ff',
};

/* ── Layout ──────────────────────────────────────────────────────────────────── */
const Page = styled.div`
  font-family: 'DM Sans', sans-serif;
  background: ${T.bg};
  min-height: 100vh;
  padding: 0;
`;

/* ── Hero bar ── */
const Hero = styled.div`
  background: ${T.navy};
  background-image:
    radial-gradient(ellipse at 10% 50%, rgba(32,180,134,0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 90% 20%, rgba(99,102,241,0.08) 0%, transparent 50%);
  padding: 32px 36px 28px;
  position: relative;
  overflow: hidden;
  animation: ${rise} 0.5s ease both;

  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(32,180,134,0.4), transparent);
  }
`;

const HeroInner = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeroLeft = styled.div``;

const GreetLabel = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${T.accent};
  margin-bottom: 6px;
`;

const GreetName = styled.h1`
  font-family: 'Sora', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
  line-height: 1.15;
`;

const GreetSub = styled.p`
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  margin: 0;
  font-weight: 300;
`;

const HeroRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DateChip = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 6px 12px;
  letter-spacing: 0.04em;
`;

const OnlineDot = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${T.accent};
  font-weight: 500;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${T.accent};
    box-shadow: 0 0 0 3px rgba(32,180,134,0.2);
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

/* ── Content area ── */
const Content = styled.div`
  padding: 28px 36px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

/* ── Section ── */
const Section = styled.div`
  animation: ${rise} 0.5s ease both;
  animation-delay: ${({ $delay }) => $delay || '0s'};
  opacity: 0;
  animation-fill-mode: forwards;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: ${T.navy};
  margin: 0;
  letter-spacing: 0.01em;
`;

const SectionCount = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: ${T.muted};
  background: ${T.border};
  border-radius: 4px;
  padding: 1px 6px;
`;

const SectionRule = styled.div`
  flex: 1;
  height: 1px;
  background: ${T.border};
`;

/* ── Stat cards grid ── */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 14px;
`;

const KpiCard = styled.div`
  background: ${T.white};
  border-radius: 14px;
  border: 1px solid ${T.border};
  padding: 20px 22px 18px;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    border-color: ${({ $accent }) => $accent || T.accent}40;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: ${({ $accent }) => $accent || T.accent};
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before { opacity: 1; }
`;

const KpiSkeleton = styled(KpiCard)`
  background: linear-gradient(90deg, #eef1f5 25%, #e5e8ed 50%, #eef1f5 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.6s infinite;
  border: 1px solid #eef1f5;
  pointer-events: none;
  min-height: 110px;
`;

const KpiTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${T.muted};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.3;
  max-width: 110px;
`;

const KpiIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`;

const KpiValue = styled.div`
  font-family: 'Sora', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: ${T.navy};
  line-height: 1;
  margin-bottom: 6px;
  animation: ${countUp} 0.5s ease both;
`;

const KpiNote = styled.div`
  font-size: 11px;
  color: ${T.muted};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const KpiTrend = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $up }) => $up ? T.accent : T.rose};
  background: ${({ $up }) => $up ? T.accentL : T.roseL};
  border-radius: 4px;
  padding: 1px 5px;
`;

/* ── Featured metric card — large hero KPI ── */
const HeroKpi = styled.div`
  background: linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 100%);
  border-radius: 16px;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(32,180,134,0.08);
  }
`;

const HeroKpiTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const HeroKpiLabel = styled.div`
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 8px;
`;

const HeroKpiValue = styled.div`
  font-family: 'Sora', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -1px;
`;

const HeroKpiSub = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  margin-top: 6px;
`;

const HeroKpiBadge = styled.div`
  background: rgba(32,180,134,0.15);
  border: 1px solid rgba(32,180,134,0.25);
  border-radius: 20px;
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 600;
  color: ${T.accent};
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${T.accent};
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

/* ── Mixed grid: 1 large + 3 medium ── */
const PrimaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 14px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr 1fr;
  }
`;

/* ── Activity tables ── */
const TableGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${T.white};
  border-radius: 14px;
  border: 1px solid ${T.border};
  overflow: hidden;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${T.border};
`;

const PanelTitle = styled.div`
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: ${T.navy};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PanelIcon = styled.div`
  width: 24px; height: 24px;
  border-radius: 6px;
  background: ${({ $bg }) => $bg};
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
`;

const PanelBadge = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: ${T.muted};
  background: ${T.bg};
  border-radius: 5px;
  padding: 2px 7px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols || '1fr 1fr 80px'};
  padding: 11px 20px;
  align-items: center;
  border-bottom: 1px solid ${T.bg};
  transition: background 0.12s;

  &:last-child { border-bottom: none; }
  &:hover { background: #fafbfc; }
`;

const HeadRow = styled(Row)`
  background: ${T.bg};
  border-bottom: 1px solid ${T.border};
  padding: 9px 20px;
  pointer-events: none;
`;

const Cell = styled.div`
  font-size: ${({ $head }) => $head ? '10px' : '13px'};
  font-weight: ${({ $head, $bold }) => $head ? '600' : $bold ? '600' : '400'};
  color: ${({ $head, $muted }) => $head ? T.muted : $muted ? T.muted : T.navy};
  text-transform: ${({ $head }) => $head ? 'uppercase' : 'none'};
  letter-spacing: ${({ $head }) => $head ? '0.06em' : '0'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${({ $mono }) => $mono ? "'DM Mono', monospace" : 'inherit'};
`;

const StatusTag = styled.span`
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ $s }) => STATUS_BG[$s]  || T.bg};
  color:      ${({ $s }) => STATUS_FG[$s]  || T.muted};
  border: 1px solid ${({ $s }) => STATUS_BD[$s] || T.border};
`;

const EmptyPanel = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${T.muted};
  font-size: 13px;

  &::before {
    content: '—';
    display: block;
    font-size: 24px;
    color: ${T.border};
    margin-bottom: 8px;
    font-family: 'Sora', sans-serif;
  }
`;

/* ── Error card ── */
const ErrorCard = styled.div`
  background: ${T.roseL};
  border: 1px solid #fecdd3;
  border-radius: 12px;
  padding: 20px 24px;
  font-size: 13px;
  color: #9f1239;
  display: flex;
  align-items: center;
  gap: 10px;
`;

/* ── Full-width invoices panel ── */
const WidePanel = styled(Panel)``;

/* ── Status colour maps ── */
const STATUS_BG = {
  scheduled:         '#eff6ff', arrived:           '#fffbeb',
  'in-consultation': '#f5f3ff', completed:         '#f0fdf4',
  cancelled:         '#fff1f2', pending:           '#fffbeb',
  paid:              '#f0fdf4', overdue:           '#fff1f2',
  unpaid:            '#fffbeb', dispensed:         '#f0fdf4',
};
const STATUS_FG = {
  scheduled:         '#1d4ed8', arrived:           '#92400e',
  'in-consultation': '#6d28d9', completed:         '#15803d',
  cancelled:         '#be123c', pending:           '#92400e',
  paid:              '#15803d', overdue:           '#be123c',
  unpaid:            '#92400e', dispensed:         '#15803d',
};
const STATUS_BD = {
  scheduled:         '#bfdbfe', arrived:           '#fde68a',
  'in-consultation': '#ddd6fe', completed:         '#bbf7d0',
  cancelled:         '#fecdd3', pending:           '#fde68a',
  paid:              '#bbf7d0', overdue:           '#fecdd3',
  unpaid:            '#fde68a', dispensed:         '#bbf7d0',
};

/* ── Helpers ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function fmt(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(val);
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function n(v) { return v ?? '—'; }

/* ── Skeleton cards ── */
function SkeletonKpis({ count = 4 }) {
  return (
    <KpiGrid>
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </KpiGrid>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user }                  = useAuth();
  const [stats,   setStats]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(false);

  useEffect(() => {
    axiosClient.get('/api/dashboard/stats')
      .then((r) => {
        const payload = r.data?.data ?? r.data;
        setStats(payload?.stats ?? payload);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const recentAppointments  = stats?.recent_appointments  ?? [];
  const recentInvoices      = stats?.recent_invoices      ?? [];
  const recentPrescriptions = stats?.recent_prescriptions ?? [];

  return (
    <>
      <DashFont />
      <Page>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Hero>
          <HeroInner>
            <HeroLeft>
              <GreetLabel>{greeting()}</GreetLabel>
              <GreetName>{user?.username || 'Doctor'} 👋</GreetName>
              <GreetSub>Here's your clinic at a glance.</GreetSub>
            </HeroLeft>
            <HeroRight>
              <OnlineDot>Live</OnlineDot>
              <DateChip>{todayLabel()}</DateChip>
            </HeroRight>
          </HeroInner>
        </Hero>

        <Content>

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <ErrorCard>
              <span style={{ fontSize: 18 }}>⚠️</span>
              Could not load dashboard data. Please check your connection or refresh the page.
            </ErrorCard>
          )}

          {/* ── Primary metrics: 1 hero + 3 KPIs ─────────────────────── */}
          {!error && (
            <Section $delay="0.05s">
              <SectionHead>
                <SectionTitle>Overview</SectionTitle>
                <SectionRule />
              </SectionHead>

              {loading ? (
                <KpiGrid>
                  {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
                </KpiGrid>
              ) : (
                <PrimaryGrid>
                  {/* Hero revenue card */}
                  <HeroKpi>
                    <HeroKpiTop>
                      <div>
                        <HeroKpiLabel>Revenue · This Month</HeroKpiLabel>
                        <HeroKpiValue>
                          {stats?.revenue_this_month != null
                            ? `₹${Number(stats.revenue_this_month).toLocaleString('en-IN')}`
                            : '—'}
                        </HeroKpiValue>
                        <HeroKpiSub>
                          Total collected: {fmt(stats?.total_revenue)}
                        </HeroKpiSub>
                      </div>
                      <HeroKpiBadge>Live</HeroKpiBadge>
                    </HeroKpiTop>
                    <div style={{
                      display: 'flex', gap: 20, marginTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: 14,
                    }}>
                      {[
                        { label: 'Total Invoices', val: n(stats?.total_invoices) },
                        { label: 'Paid',           val: n(stats?.paid_invoices) },
                        { label: 'Overdue',        val: n(stats?.overdue_invoices) },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                            {label}
                          </div>
                          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </HeroKpi>

                  {/* 3 supporting KPIs */}
                  {[
                    {
                      label: 'Total Patients',
                      value: n(stats?.total_patients),
                      note:  `${n(stats?.active_patients)} active`,
                      accent: T.sky, bg: T.skyL,
                      icon: '🧑‍⚕️',
                    },
                    {
                      label: "Today's Appointments",
                      value: n(stats?.appointments_today),
                      note:  `${n(stats?.upcoming_appointments)} scheduled`,
                      accent: T.indigo, bg: T.indigoL,
                      icon: '📅',
                    },
                    {
                      label: 'Active Staff',
                      value: n(stats?.active_staff),
                      note:  'All roles',
                      accent: T.accent, bg: T.accentL,
                      icon: '👥',
                    },
                  ].map(({ label, value, note, accent, bg, icon }) => (
                    <KpiCard key={label} $accent={accent}>
                      <KpiTop>
                        <KpiLabel>{label}</KpiLabel>
                        <KpiIcon $bg={bg}>{icon}</KpiIcon>
                      </KpiTop>
                      <KpiValue>{value}</KpiValue>
                      <KpiNote>{note}</KpiNote>
                    </KpiCard>
                  ))}
                </PrimaryGrid>
              )}
            </Section>
          )}

          {/* ── Prescriptions row ─────────────────────────────────────── */}
          {!error && (
            <Section $delay="0.12s">
              <SectionHead>
                <SectionTitle>Prescriptions</SectionTitle>
                <SectionRule />
              </SectionHead>

              {loading ? (
                <KpiGrid>
                  {Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)}
                </KpiGrid>
              ) : (
                <KpiGrid>
                  {[
                    {
                      label: 'Total',
                      value: n(stats?.total_prescriptions),
                      note: 'All time',
                      accent: T.indigo, bg: T.indigoL, icon: '💊',
                    },
                    {
                      label: 'Pending Dispense',
                      value: n(stats?.pending_prescriptions),
                      note: 'Awaiting pharmacist',
                      accent: T.gold, bg: T.goldL, icon: '⏳',
                    },
                    {
                      label: 'Dispensed',
                      value: n(stats?.dispensed_prescriptions),
                      note: 'Successfully issued',
                      accent: T.accent, bg: T.accentL, icon: '✅',
                    },
                  ].map(({ label, value, note, accent, bg, icon }) => (
                    <KpiCard key={label} $accent={accent}>
                      <KpiTop>
                        <KpiLabel>{label}</KpiLabel>
                        <KpiIcon $bg={bg}>{icon}</KpiIcon>
                      </KpiTop>
                      <KpiValue>{value}</KpiValue>
                      <KpiNote>{note}</KpiNote>
                    </KpiCard>
                  ))}
                </KpiGrid>
              )}
            </Section>
          )}

          {/* ── Recent activity: Appointments + Prescriptions ─────────── */}
          {!loading && !error && (
            <Section $delay="0.18s">
              <SectionHead>
                <SectionTitle>Recent Activity</SectionTitle>
                <SectionCount>{recentAppointments.length + recentPrescriptions.length}</SectionCount>
                <SectionRule />
              </SectionHead>

              <TableGrid>

                {/* Appointments */}
                <Panel>
                  <PanelHead>
                    <PanelTitle>
                      <PanelIcon $bg={T.indigoL}>📅</PanelIcon>
                      Appointments
                    </PanelTitle>
                    <PanelBadge>{recentAppointments.length}</PanelBadge>
                  </PanelHead>
                  <HeadRow $cols="1.8fr 1.2fr 72px 90px">
                    <Cell $head>Patient</Cell>
                    <Cell $head>Doctor</Cell>
                    <Cell $head>Time</Cell>
                    <Cell $head>Status</Cell>
                  </HeadRow>
                  {recentAppointments.length === 0
                    ? <EmptyPanel>No appointments yet</EmptyPanel>
                    : recentAppointments.map((a) => (
                      <Row key={a.id} $cols="1.8fr 1.2fr 72px 90px">
                        <Cell $bold>{a.patient_name || `#${a.patient_id}`}</Cell>
                        <Cell $muted>{a.doctor_name || `#${a.doctor_id}`}</Cell>
                        <Cell $muted $mono style={{ fontSize: 11 }}>{fmtTime(a.appointment_time)}</Cell>
                        <Cell><StatusTag $s={a.status}>{a.status}</StatusTag></Cell>
                      </Row>
                    ))
                  }
                </Panel>

                {/* Prescriptions */}
                <Panel>
                  <PanelHead>
                    <PanelTitle>
                      <PanelIcon $bg={T.accentL}>💊</PanelIcon>
                      Prescriptions
                    </PanelTitle>
                    <PanelBadge>{recentPrescriptions.length}</PanelBadge>
                  </PanelHead>
                  <HeadRow $cols="1.8fr 1.6fr 60px 90px">
                    <Cell $head>Patient</Cell>
                    <Cell $head>Medicine</Cell>
                    <Cell $head>Days</Cell>
                    <Cell $head>Status</Cell>
                  </HeadRow>
                  {recentPrescriptions.length === 0
                    ? <EmptyPanel>No prescriptions yet</EmptyPanel>
                    : recentPrescriptions.map((p) => (
                      <Row key={p.id} $cols="1.8fr 1.6fr 60px 90px">
                        <Cell $bold>{p.patient_name || `#${p.patient_id}`}</Cell>
                        <Cell $muted style={{ fontSize: 12 }}>{p.medicine_name || '—'}</Cell>
                        <Cell $muted $mono style={{ fontSize: 11 }}>{p.duration_days ?? '—'}d</Cell>
                        <Cell><StatusTag $s={p.status}>{p.status}</StatusTag></Cell>
                      </Row>
                    ))
                  }
                </Panel>

              </TableGrid>
            </Section>
          )}

          {/* ── Recent Invoices — full width ──────────────────────────── */}
          {!loading && !error && (
            <Section $delay="0.22s">
              <SectionHead>
                <SectionTitle>Recent Invoices</SectionTitle>
                <SectionCount>{recentInvoices.length}</SectionCount>
                <SectionRule />
              </SectionHead>

              <WidePanel>
                <HeadRow $cols="1.4fr 2fr 1fr 1fr 1fr">
                  <Cell $head>Invoice</Cell>
                  <Cell $head>Patient</Cell>
                  <Cell $head>Amount</Cell>
                  <Cell $head>Due</Cell>
                  <Cell $head>Status</Cell>
                </HeadRow>
                {recentInvoices.length === 0
                  ? <EmptyPanel>No invoices found</EmptyPanel>
                  : recentInvoices.map((inv) => (
                    <Row key={inv.id} $cols="1.4fr 2fr 1fr 1fr 1fr">
                      <Cell $bold $mono style={{ fontSize: 12 }}>
                        {inv.invoice_number || `INV-${String(inv.id).padStart(4, '0')}`}
                      </Cell>
                      <Cell>{inv.patient_name || '—'}</Cell>
                      <Cell $bold style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {fmt(inv.total_amount ?? inv.amount)}
                      </Cell>
                      <Cell $muted style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                        {fmtDate(inv.due_date)}
                      </Cell>
                      <Cell><StatusTag $s={inv.status}>{inv.status}</StatusTag></Cell>
                    </Row>
                  ))
                }
              </WidePanel>
            </Section>
          )}

        </Content>
      </Page>
    </>
  );
}