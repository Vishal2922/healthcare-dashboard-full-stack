import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  TeamOutlined, UserOutlined, CheckCircleOutlined,
  StopOutlined, SwapOutlined, SafetyCertificateOutlined, CloseOutlined,
} from '@ant-design/icons';
import useStaff from '../../modules/staff/hooks/useStaff';
import useUsers from '../../modules/users/hooks/useUsers';

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`to{transform:rotate(360deg)}`;
const shake  = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}`;

const Page          = styled.div`padding:2rem;max-width:1200px;margin:0 auto;animation:${fadeUp} 0.4s ease both;font-family:'DM Sans',sans-serif;`;
const PageTitle     = styled.h1`font-size:22px;font-weight:600;color:#0e1b2a;margin:0 0 0.3rem;display:flex;align-items:center;gap:10px;`;
const TitleIcon     = styled.span`width:36px;height:36px;border-radius:10px;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;`;
const PageSub       = styled.p`font-size:14px;color:#718096;margin:0 0 2rem;`;
const RoleGrid      = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:2.5rem;`;
const RoleCard      = styled.div`background:white;border:1.5px solid ${({$active})=>$active?'#20b486':'#e2e8f0'};border-radius:14px;padding:1.25rem;cursor:pointer;transition:border-color 0.18s,box-shadow 0.18s;box-shadow:${({$active})=>$active?'0 0 0 3px rgba(32,180,134,0.12)':'none'};&:hover{border-color:#20b486;}`;
const RoleCardHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;`;
const RoleNameRow   = styled.div`display:flex;align-items:center;gap:10px;`;
const RoleIcon      = styled.div`width:36px;height:36px;border-radius:10px;background:${({$color})=>$color||'#0e1b2a'};color:white;display:flex;align-items:center;justify-content:center;font-size:16px;`;
const RoleName      = styled.div`font-size:15px;font-weight:600;color:#0e1b2a;`;
const RoleCount     = styled.div`font-size:12px;color:#718096;background:#f7f9fb;border:1px solid #e2e8f0;border-radius:99px;padding:2px 10px;`;
const PermissionList = styled.div`display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;`;
const PermTag       = styled.span`font-size:11px;font-weight:500;padding:2px 8px;border-radius:6px;background:#f0fff4;color:#276749;border:1px solid #c6f6d5;`;
const SectionTitle  = styled.h2`font-size:16px;font-weight:600;color:#0e1b2a;margin:0 0 1rem;display:flex;align-items:center;gap:8px;`;
const TableWrap     = styled.div`background:white;border-radius:14px;border:1.5px solid #e2e8f0;overflow:hidden;`;
const Table         = styled.table`width:100%;border-collapse:collapse;`;
const Th            = styled.th`text-align:left;padding:12px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#718096;background:#f7f9fb;border-bottom:1.5px solid #e2e8f0;`;
const Td            = styled.td`padding:14px 16px;font-size:14px;color:#2d3748;border-bottom:1px solid #f0f4f8;vertical-align:middle;`;
const Tr            = styled.tr`transition:background 0.12s;&:hover td{background:#f7f9fb;}&:last-child td{border-bottom:none;}`;
const CenterCell    = styled.td`text-align:center;padding:3rem 1rem;color:#a0aab4;font-size:14px;`;
const Spinner       = styled.div`width:22px;height:22px;border:2.5px solid #e2e8f0;border-top-color:#20b486;border-radius:50%;animation:${spin} 0.7s linear infinite;margin:0 auto;`;
const AvatarRow     = styled.div`display:flex;align-items:center;gap:10px;`;
const Avatar        = styled.div`width:32px;height:32px;border-radius:50%;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;`;
const AvatarName    = styled.div`font-weight:500;font-size:14px;color:#0e1b2a;`;
const AvatarSub     = styled.div`font-size:12px;color:#718096;`;
const Badge         = styled.span`display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 10px;border-radius:99px;font-size:11px;font-weight:600;background:${({$v})=>$v==='active'?'#f0fff4':$v==='inactive'?'#fff5f5':'#f7f9fb'};color:${({$v})=>$v==='active'?'#276749':$v==='inactive'?'#c53030':'#4a5568'};border:1px solid ${({$v})=>$v==='active'?'#c6f6d5':$v==='inactive'?'#fed7d7':'#e2e8f0'};`;
const Btn           = styled.button`display:inline-flex;align-items:center;gap:6px;border:none;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:0 12px;height:30px;transition:background 0.15s,transform 0.1s;&:active{transform:scale(0.97);}&:disabled{opacity:0.5;cursor:not-allowed;}`;
const ActivateBtn   = styled(Btn)`background:#f0fff4;color:#276749;border:1px solid #c6f6d5;&:hover{background:#c6f6d5;}`;
const DeactivateBtn = styled(Btn)`background:#fff5f5;color:#c53030;border:1px solid #fed7d7;&:hover{background:#fed7d7;}`;
const AssignBtn     = styled(Btn)`background:#ebf4ff;color:#2b6cb0;border:1px solid #bee3f8;&:hover{background:#bee3f8;}`;
const IconBtn       = styled.button`width:30px;height:30px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;color:#718096;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;&:hover{border-color:#20b486;color:#20b486;}`;
const ErrorBanner   = styled.div`background:#fff5f5;border:1.5px solid #fed7d7;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;color:#c53030;animation:${shake} 0.4s ease;`;
const Overlay       = styled.div`position:fixed;inset:0;background:rgba(14,27,42,0.45);display:flex;align-items:center;justify-content:center;z-index:999;padding:1rem;`;
const ModalCard     = styled.div`background:white;border-radius:16px;padding:2rem;width:100%;max-width:420px;animation:${fadeUp} 0.3s ease both;`;
const ModalTitle    = styled.h2`font-size:18px;font-weight:600;color:#0e1b2a;margin:0 0 1.25rem;`;
const FieldLabel    = styled.label`display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#4a5568;margin-bottom:6px;`;
const FieldSelect   = styled.select`width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;cursor:pointer;&:focus{border-color:#20b486;}margin-bottom:1.25rem;`;
const ModalFooter   = styled.div`display:flex;gap:10px;justify-content:flex-end;`;
const CancelBtn     = styled(Btn)`background:#f7f9fb;color:#4a5568;border:1.5px solid #e2e8f0;height:40px;padding:0 16px;font-size:14px;&:hover{background:#edf2f7;}`;
const PrimaryBtn    = styled(Btn)`background:#0e1b2a;color:white;height:40px;padding:0 18px;font-size:14px;&:hover{background:#1a2d43;}`;

const ROLE_COLORS = { admin:'#0e1b2a', provider:'#6b46c1', doctor:'#6b46c1', nurse:'#2b6cb0', receptionist:'#2c7a7b', pharmacist:'#744210', patient:'#702459' };
const getRoleColor  = (name='') => ROLE_COLORS[name.toLowerCase()] ?? '#4a5568';
const getInitials   = (name='') => name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';

export default function StaffManagement() {
  const {
    roles, staffByRole, loading, submitting, error,
    fetchRoles, fetchStaffByRole,
    assignRole, activateStaff, deactivateStaff, dismissError,
  } = useStaff();

  const { roles: tenantRoles, fetchRoles: fetchTenantRoles } = useUsers();

  const [activeRoleId,  setActiveRoleId]  = useState(null);
  const [assignModal,   setAssignModal]   = useState(false);
  const [assignTarget,  setAssignTarget]  = useState(null);
  const [newRoleId,     setNewRoleId]     = useState('');

  useEffect(() => { fetchRoles(); fetchTenantRoles(); }, []); // eslint-disable-line

  useEffect(() => {
    if (roles.length && !activeRoleId) {
      const first = roles[0];
      setActiveRoleId(first.id);
      fetchStaffByRole(first.id);
    }
  }, [roles]); // eslint-disable-line

  const handleRoleCardClick = (role) => {
    setActiveRoleId(role.id);
    if (!staffByRole[role.id]) fetchStaffByRole(role.id);
  };

  const openAssign = (s) => { setAssignTarget(s); setNewRoleId(''); setAssignModal(true); };

  const handleAssign = () => {
    if (!newRoleId || !assignTarget) return;
    assignRole(assignTarget.id, newRoleId);
    setAssignModal(false);
  };

  const activeRoleStaff = staffByRole[activeRoleId] ?? [];
  const activeRole      = roles.find(r => r.id === activeRoleId);

  return (
    <Page>
      <PageTitle><TitleIcon><SafetyCertificateOutlined /></TitleIcon>Staff Roles</PageTitle>
      <PageSub>View roles, permissions, and manage staff assignments for this clinic.</PageSub>

      {error && (
        <ErrorBanner>{error}<IconBtn onClick={dismissError}><CloseOutlined /></IconBtn></ErrorBanner>
      )}

      {loading && !roles.length ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#a0aab4'}}>
          <Spinner style={{margin:'0 auto 12px'}}/>Loading roles…
        </div>
      ) : (
        <RoleGrid>
          {roles.map(role => {
            const rname = role.role_name ?? role.name ?? '';
            const perms = role.permissions ?? [];
            const count = staffByRole[role.id]?.length ?? '—';
            return (
              <RoleCard key={role.id} $active={activeRoleId===role.id} onClick={()=>handleRoleCardClick(role)}>
                <RoleCardHeader>
                  <RoleNameRow>
                    <RoleIcon $color={getRoleColor(rname)}><TeamOutlined /></RoleIcon>
                    <RoleName>{rname}</RoleName>
                  </RoleNameRow>
                  <RoleCount>{count} staff</RoleCount>
                </RoleCardHeader>
                {perms.length > 0 && (
                  <PermissionList>
                    {perms.slice(0,4).map(p=>(
                      <PermTag key={p.permission_key??p.id}>{p.permission_key??p.description}</PermTag>
                    ))}
                    {perms.length > 4 && (
                      <PermTag style={{background:'#f7f9fb',color:'#718096',border:'1px solid #e2e8f0'}}>+{perms.length-4} more</PermTag>
                    )}
                  </PermissionList>
                )}
              </RoleCard>
            );
          })}
        </RoleGrid>
      )}

      {activeRole && (
        <>
          <SectionTitle>
            <UserOutlined />Staff with role: {activeRole.role_name ?? activeRole.name}
          </SectionTitle>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Staff Member</Th><Th>Department</Th><Th>Specialization</Th>
                  <Th>Hire Date</Th><Th>Status</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><CenterCell colSpan={6}><Spinner /></CenterCell></tr>
                ) : activeRoleStaff.length === 0 ? (
                  <tr><CenterCell colSpan={6}>No staff members assigned to this role.</CenterCell></tr>
                ) : activeRoleStaff.map(s => {
                  const name   = s.full_name??s.username??'—';
                  const email  = s.email??'—';
                  const dept   = s.department??'—';
                  const spec   = s.specialization??'—';
                  const hire   = s.hire_date??'—';
                  const status = s.user_status??s.status??'inactive';
                  return (
                    <Tr key={s.id}>
                      <Td>
                        <AvatarRow>
                          <Avatar>{getInitials(name)}</Avatar>
                          <div><AvatarName>{name}</AvatarName><AvatarSub>{email}</AvatarSub></div>
                        </AvatarRow>
                      </Td>
                      <Td>{dept}</Td><Td>{spec}</Td><Td>{hire}</Td>
                      <Td>
                        <Badge $v={status}>
                          {status==='active'?<CheckCircleOutlined />:<StopOutlined />} {status}
                        </Badge>
                      </Td>
                      <Td>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          <AssignBtn disabled={submitting} onClick={()=>openAssign(s)}>
                            <SwapOutlined /> Change Role
                          </AssignBtn>
                          {status==='active'
                            ? <DeactivateBtn disabled={submitting} onClick={()=>deactivateStaff(s.id)}><StopOutlined />Deactivate</DeactivateBtn>
                            : <ActivateBtn   disabled={submitting} onClick={()=>activateStaff(s.id)}><CheckCircleOutlined />Activate</ActivateBtn>
                          }
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </>
      )}

      {assignModal && assignTarget && (
        <Overlay onClick={()=>setAssignModal(false)}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <ModalTitle>Change Role</ModalTitle>
            <p style={{fontSize:14,color:'#4a5568',marginBottom:'1rem',lineHeight:1.6}}>
              Reassign role for <strong>{assignTarget.full_name??assignTarget.username}</strong>.
              This updates their JWT permissions on next login.
            </p>
            <FieldLabel htmlFor="new-role">New Role</FieldLabel>
            <FieldSelect id="new-role" value={newRoleId} onChange={e=>setNewRoleId(e.target.value)}>
              <option value="">Select a role…</option>
              {(tenantRoles.length?tenantRoles:roles).map(r=>(
                <option key={r.id} value={r.id}>{r.role_name??r.name}</option>
              ))}
            </FieldSelect>
            <ModalFooter>
              <CancelBtn onClick={()=>setAssignModal(false)}>Cancel</CancelBtn>
              <PrimaryBtn disabled={!newRoleId||submitting} onClick={handleAssign}>
                {submitting?'Saving…':'Assign Role'}
              </PrimaryBtn>
            </ModalFooter>
          </ModalCard>
        </Overlay>
      )}
    </Page>
  );
}