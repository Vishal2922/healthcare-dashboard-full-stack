import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  UserAddOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, CheckCircleOutlined, StopOutlined,
  CloseOutlined, TeamOutlined,
} from '@ant-design/icons';
import useUsers from '../../modules/users/hooks/useUsers';
import usePermission from '../../hooks/usePermission';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`to{transform:rotate(360deg)}`;
const shake  = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}`;

// ─── Styled Components ───────────────────────────────────────────────────────
const Page          = styled.div`padding:2rem;max-width:1200px;margin:0 auto;animation:${fadeUp} 0.4s ease both;font-family:'DM Sans',sans-serif;`;
const PageHeader    = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;`;
const PageTitle     = styled.h1`font-size:22px;font-weight:600;color:#0e1b2a;margin:0;display:flex;align-items:center;gap:10px;`;
const TitleIcon     = styled.span`width:36px;height:36px;border-radius:10px;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;`;
const Toolbar       = styled.div`display:flex;gap:12px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;`;
const SearchWrap    = styled.div`position:relative;flex:1;min-width:200px;max-width:320px;`;
const SearchIcon    = styled.span`position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#b0bac4;font-size:15px;`;
const SearchInput   = styled.input`width:100%;height:40px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px 0 36px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;box-sizing:border-box;transition:border-color 0.18s;&::placeholder{color:#b0bac4;}&:focus{border-color:${({ theme }) => theme.colors.primary};box-shadow:${({ theme }) => `0 0 0 3px ${theme.colors.primary}1f`};}`;
const FilterSelect  = styled.select`height:40px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;cursor:pointer;&:focus{border-color:${({ theme }) => theme.colors.primary};}`;
const Btn           = styled.button`display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.18s,transform 0.12s;&:active{transform:scale(0.97);}&:disabled{opacity:0.5;cursor:not-allowed;}`;
const PrimaryBtn    = styled(Btn)`background:#0e1b2a;color:white;&:hover:not(:disabled){background:#1a2d43;}`;
const DangerBtn     = styled(Btn)`background:#fff5f5;color:#c53030;border:1.5px solid #fed7d7;height:32px;padding:0 12px;font-size:13px;&:hover:not(:disabled){background:#fed7d7;}`;
const SuccessBtn    = styled(Btn)`background:#f0fff4;color:#276749;border:1.5px solid #c6f6d5;height:32px;padding:0 12px;font-size:13px;&:hover:not(:disabled){background:#c6f6d5;}`;
const IconBtn       = styled.button`width:32px;height:32px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;color:#718096;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.15s;&:hover{border-color:${({ theme }) => theme.colors.primary};color:${({ theme }) => theme.colors.primary};}`;
const TableWrap     = styled.div`background:white;border-radius:14px;border:1.5px solid #e2e8f0;overflow:hidden;`;
const Table         = styled.table`width:100%;border-collapse:collapse;`;
const Th            = styled.th`text-align:left;padding:12px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#718096;background:#f7f9fb;border-bottom:1.5px solid #e2e8f0;`;
const Td            = styled.td`padding:14px 16px;font-size:14px;color:#2d3748;border-bottom:1px solid #f0f4f8;vertical-align:middle;`;
const Tr            = styled.tr`transition:background 0.12s;&:hover td{background:#f7f9fb;}&:last-child td{border-bottom:none;}`;
const CenterCell    = styled.td`text-align:center;padding:3rem 1rem;color:#a0aab4;font-size:14px;`;
const Spinner       = styled.div`width:24px;height:24px;border:2.5px solid #e2e8f0;border-top-color:${({ theme }) => theme.colors.primary};border-radius:50%;animation:${spin} 0.7s linear infinite;margin:0 auto;`;
const ErrorBanner   = styled.div`background:#fff5f5;border:1.5px solid #fed7d7;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;color:#c53030;animation:${shake} 0.4s ease;`;
const SuccessBanner = styled.div`background:#f0fff4;border:1.5px solid #c6f6d5;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;color:#276749;`;
const Badge         = styled.span`display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 10px;border-radius:99px;font-size:11px;font-weight:600;background:${({$v})=>$v==='active'?'#f0fff4':$v==='inactive'?'#fff5f5':$v==='admin'?'#ebf4ff':$v==='provider'?'#faf5ff':'#f7f9fb'};color:${({$v})=>$v==='active'?'#276749':$v==='inactive'?'#c53030':$v==='admin'?'#2b6cb0':$v==='provider'?'#6b46c1':'#4a5568'};border:1px solid ${({$v})=>$v==='active'?'#c6f6d5':$v==='inactive'?'#fed7d7':$v==='admin'?'#bee3f8':$v==='provider'?'#e9d8fd':'#e2e8f0'};`;
const AvatarRow     = styled.div`display:flex;align-items:center;gap:10px;`;
const Avatar        = styled.div`width:34px;height:34px;border-radius:50%;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;`;
const AvatarName    = styled.div`font-weight:500;font-size:14px;color:#0e1b2a;`;
const AvatarSub     = styled.div`font-size:12px;color:#718096;`;
const ActionRow     = styled.div`display:flex;align-items:center;gap:8px;`;
const PaginationRow = styled.div`display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-top:1.5px solid #e2e8f0;font-size:13px;color:#718096;`;
const PageBtns      = styled.div`display:flex;gap:6px;`;
const PageBtn       = styled.button`width:32px;height:32px;border:1.5px solid ${({$active, theme})=>$active?theme.colors.primary:'#e2e8f0'};border-radius:8px;background:${({$active, theme})=>$active?theme.colors.primary:'white'};color:${({$active})=>$active?'white':'#4a5568'};font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;&:hover:not(:disabled){border-color:${({ theme }) => theme.colors.primary};}&:disabled{opacity:0.4;cursor:not-allowed;}`;
const EmptyState    = styled.div`text-align:center;padding:3rem 1rem;`;
const EmptyIcon     = styled.div`width:56px;height:56px;border-radius:14px;background:#f7f9fb;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px;color:#a0aab4;`;
const EmptyTitle    = styled.div`font-size:15px;font-weight:600;color:#0e1b2a;margin-bottom:6px;`;
const EmptyText     = styled.div`font-size:13px;color:#a0aab4;`;

// ── Modal styled components ───────────────────────────────────────────────────
const Overlay       = styled.div`position:fixed;inset:0;background:rgba(14,27,42,0.5);display:flex;align-items:flex-start;justify-content:center;z-index:999;padding:2rem 1rem;overflow-y:auto;`;
const ModalCard     = styled.div`background:white;border-radius:16px;padding:2rem;width:100%;max-width:500px;margin:auto;animation:${fadeUp} 0.25s ease both;`;
const ModalTitle    = styled.h2`font-size:18px;font-weight:600;color:#0e1b2a;margin:0 0 1.5rem;display:flex;align-items:center;justify-content:space-between;`;
const FormGrid      = styled.div`display:flex;flex-direction:column;gap:16px;margin-bottom:1.5rem;`;
const Field         = styled.div`display:flex;flex-direction:column;gap:6px;`;
const FieldLabel    = styled.label`font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#4a5568;`;
const FieldInput    = styled.input`width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;outline:none;box-sizing:border-box;transition:border-color 0.18s;&:focus{border-color:${({ theme }) => theme.colors.primary};box-shadow:${({ theme }) => `0 0 0 3px ${theme.colors.primary}1f`};}`;
const FieldSelect   = styled.select`width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;cursor:pointer;box-sizing:border-box;&:focus{border-color:${({ theme }) => theme.colors.primary};}&:disabled{background:#f7f9fb;color:#a0aab4;cursor:not-allowed;}`;
const HelpText      = styled.p`font-size:12px;color:#a0aab4;margin:4px 0 0;line-height:1.5;`;
const ModalFooter   = styled.div`display:flex;gap:10px;justify-content:flex-end;padding-top:8px;border-top:1px solid #f0f4f8;`;
const CancelBtn     = styled(Btn)`background:#f7f9fb;color:#4a5568;border:1.5px solid #e2e8f0;&:hover{background:#edf2f7;}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials      = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const roleBadgeVariant = (role = '') => {
  const r = role.toLowerCase();
  if (r === 'admin')                      return 'admin';
  if (r === 'provider' || r === 'doctor') return 'provider';
  return 'default';
};

const EMPTY_FORM = {
  // User account fields (for registration)
  username:       '',
  email:          '',
  password:       '',
  full_name:      '',
  // Staff profile fields
  role_id:        '',
  department:     '',
  specialization: '',
  hire_date:      '',
  status:         'active',
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function UserManagement() {
  const {
    users, pagination, loading, submitting, error,
    roles, departments,
    fetchUsers,
    createUser, updateUser, deleteUser, toggleStatus,
    fetchRoles, fetchDepartments, dismissError,
  } = useUsers();

  const { can } = usePermission();

  // ── RBAC flags ─────────────────────────────────────────────────────────────
  const canCreate = can('users', 'create');
  const canEdit   = can('users', 'edit');
  const canDelete = can('users', 'delete');

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [editId,       setEditId]       = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);
  const [successMsg,   setSuccessMsg]   = useState('');

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []); // eslint-disable-line

  // ── Debounced search / filter ─────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers({ search, status: statusFilter, role_id: roleFilter, page: 1 });
    }, 380);
    return () => clearTimeout(t);
  }, [search, statusFilter, roleFilter]); // eslint-disable-line

  // ── Auto-clear success banner ─────────────────────────────────────────────
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Modal open helpers ────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('create');
  };

  const openEdit = (user) => {
    setForm({
      user_id:        user.user_id ?? user.id ?? '',
      role_id:        user.role_id ?? '',
      department:     user.department ?? '',
      specialization: user.specialization ?? '',
      hire_date:      user.hire_date ?? '',
      status:         user.status ?? user.user_status ?? 'active',
    });
    setEditId(user.id);
    setModal('edit');
  };

  const openDelete = (id) => { setDeleteId(id); setModal('delete'); };

  const closeModal = () => {
    setModal(null);
    setEditId(null);
    setDeleteId(null);
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (modal === 'create') {
      createUser(form);
      setSuccessMsg('Staff member added successfully.');
    } else if (modal === 'edit') {
      updateUser({ id: editId, ...form });
      setSuccessMsg('Staff record updated.');
    }
    closeModal();
  };

  const handleDelete = () => {
    deleteUser(deleteId);
    setSuccessMsg('Staff member removed.');
    closeModal();
  };

  const handleToggle = (user) => {
    const currentStatus = user.user_status ?? user.status ?? 'active';
    toggleStatus(user.id, currentStatus);
    const next = currentStatus === 'active' ? 'inactive' : 'active';
    setSuccessMsg(`Staff member ${next === 'active' ? 'activated' : 'deactivated'}.`);
  };

  const handlePage = (page) => fetchUsers({ page });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page>

      {/* ── Page Header ── */}
      <PageHeader>
        <PageTitle>
          <TitleIcon><TeamOutlined /></TitleIcon>
          User Management
        </PageTitle>
        <PrimaryBtn onClick={openCreate}>
          <UserAddOutlined /> Add Staff Member
        </PrimaryBtn>
      </PageHeader>

      {/* ── Banners ── */}
      {error && (
        <ErrorBanner>
          {error}
          <IconBtn onClick={dismissError}><CloseOutlined /></IconBtn>
        </ErrorBanner>
      )}
      {successMsg && (
        <SuccessBanner>
          <CheckCircleOutlined /> {successMsg}
          <IconBtn onClick={() => setSuccessMsg('')}><CloseOutlined /></IconBtn>
        </SuccessBanner>
      )}

      {/* ── Toolbar ── */}
      <Toolbar>
        <SearchWrap>
          <SearchIcon><SearchOutlined /></SearchIcon>
          <SearchInput
            placeholder="Search by name or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>
        <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <FilterSelect value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.role_name ?? r.name}</option>
          ))}
        </FilterSelect>
      </Toolbar>

      {/* ── Table ── */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Staff Member</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Hire Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><CenterCell colSpan={6}><Spinner /></CenterCell></tr>
            ) : users.length === 0 ? (
              <tr>
                <CenterCell colSpan={6}>
                  <EmptyState>
                    <EmptyIcon><TeamOutlined /></EmptyIcon>
                    <EmptyTitle>No staff members yet</EmptyTitle>
                    <EmptyText>
                      Click "Add Staff Member" to create a new staff account.
                    </EmptyText>
                  </EmptyState>
                </CenterCell>
              </tr>
            ) : users.map(user => {
              const name   = user.full_name   ?? user.username ?? '—';
              const email  = user.email       ?? '—';
              const role   = user.role_name   ?? '—';
              const dept   = user.department  ?? '—';
              const hire   = user.hire_date   ?? '—';
              const status = user.user_status ?? user.status ?? 'inactive';

              return (
                <Tr key={user.id}>
                  <Td>
                    <AvatarRow>
                      <Avatar>{getInitials(name)}</Avatar>
                      <div>
                        <AvatarName>{name}</AvatarName>
                        <AvatarSub>{email}</AvatarSub>
                      </div>
                    </AvatarRow>
                  </Td>
                  <Td><Badge $v={roleBadgeVariant(role)}>{role}</Badge></Td>
                  <Td>{dept}</Td>
                  <Td>{hire}</Td>
                  <Td>
                    <Badge $v={status}>
                      {status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />} {status}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionRow>
                      <IconBtn title="Edit" onClick={() => openEdit(user)}>
                        <EditOutlined />
                      </IconBtn>
                      {status === 'active' ? (
                        <DangerBtn disabled={submitting} onClick={() => handleToggle(user)}>
                          <StopOutlined /> Deactivate
                        </DangerBtn>
                      ) : (
                        <SuccessBtn disabled={submitting} onClick={() => handleToggle(user)}>
                          <CheckCircleOutlined /> Activate
                        </SuccessBtn>
                      )}
                      <IconBtn
                        title="Delete"
                        style={{ color: '#c53030', borderColor: '#fed7d7' }}
                        onClick={() => openDelete(user.id)}
                      >
                        <DeleteOutlined />
                      </IconBtn>
                    </ActionRow>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>

        {pagination.total_pages > 1 && (
          <PaginationRow>
            <span>Showing {users.length} of {pagination.total} staff members</span>
            <PageBtns>
              <PageBtn disabled={pagination.page <= 1} onClick={() => handlePage(pagination.page - 1)}>‹</PageBtn>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.page) <= 1)
                .map(p => (
                  <PageBtn key={p} $active={p === pagination.page} onClick={() => handlePage(p)}>{p}</PageBtn>
                ))}
              <PageBtn disabled={pagination.page >= pagination.total_pages} onClick={() => handlePage(pagination.page + 1)}>›</PageBtn>
            </PageBtns>
          </PaginationRow>
        )}
      </TableWrap>

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE MODAL — Creates a brand new user account + staff profile.
          Step 1: POST /api/auth/register  (username, email, password, full_name, role_id)
          Step 2: POST /api/staff          (user_id from step 1 + dept, hire_date, etc.)
      ══════════════════════════════════════════════════════════════════════ */}
      {modal === 'create' && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>
              Add Staff Member
              <IconBtn onClick={closeModal}><CloseOutlined /></IconBtn>
            </ModalTitle>

            <form onSubmit={handleSubmit}>
              <FormGrid>

                {/* ── Account section ─────────────────────────────── */}
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#a0aab4', marginBottom: -8 }}>
                  Account Details
                </div>

                <Field>
                  <FieldLabel htmlFor="full_name">Full Name *</FieldLabel>
                  <FieldInput
                    id="full_name"
                    placeholder="e.g. Dr. Priya Sharma"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username">Username *</FieldLabel>
                  <FieldInput
                    id="username"
                    placeholder="e.g. dr.priya"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email *</FieldLabel>
                  <FieldInput
                    id="email"
                    type="email"
                    placeholder="priya@clinic.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password *</FieldLabel>
                  <FieldInput
                    id="password"
                    type="password"
                    placeholder="Min 8 chars, upper, lower, number, special"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                  <HelpText>
                    Must contain uppercase, lowercase, number and a special character (@$!%*?&).
                  </HelpText>
                </Field>

                {/* ── Staff Profile section ────────────────────────── */}
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#a0aab4', marginBottom: -8, marginTop: 4 }}>
                  Staff Profile
                </div>

                <Field>
                  <FieldLabel htmlFor="role_id">Role *</FieldLabel>
                  <FieldSelect
                    id="role_id"
                    value={form.role_id}
                    onChange={e => setForm({ ...form, role_id: e.target.value })}
                    required
                  >
                    <option value="">Select role…</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.role_name ?? r.name}</option>
                    ))}
                  </FieldSelect>
                </Field>

                <Field>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <FieldInput
                    id="department"
                    list="dept-opts"
                    placeholder="e.g. General Medicine"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                  <datalist id="dept-opts">
                    {departments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </Field>

                <Field>
                  <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                  <FieldInput
                    id="specialization"
                    placeholder="e.g. Pediatrics"
                    value={form.specialization}
                    onChange={e => setForm({ ...form, specialization: e.target.value })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="hire_date">Hire Date</FieldLabel>
                  <FieldInput
                    id="hire_date"
                    type="date"
                    value={form.hire_date}
                    onChange={e => setForm({ ...form, hire_date: e.target.value })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <FieldSelect
                    id="status"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </FieldSelect>
                </Field>

              </FormGrid>

              <ModalFooter>
                <CancelBtn type="button" onClick={closeModal}>Cancel</CancelBtn>
                <PrimaryBtn
                  type="submit"
                  disabled={submitting || !form.username || !form.email || !form.password || !form.full_name}
                >
                  {submitting ? 'Creating…' : 'Create Staff Member'}
                </PrimaryBtn>
              </ModalFooter>
            </form>
          </ModalCard>
        </Overlay>
      )}

      {/* ── EDIT MODAL ── */}
      {modal === 'edit' && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>
              Edit Staff Record
              <IconBtn onClick={closeModal}><CloseOutlined /></IconBtn>
            </ModalTitle>

            <form onSubmit={handleSubmit}>
              <FormGrid>
                <Field>
                  <FieldLabel htmlFor="edit_role_id">Role</FieldLabel>
                  <FieldSelect
                    id="edit_role_id"
                    value={form.role_id}
                    onChange={e => setForm({ ...form, role_id: e.target.value })}
                  >
                    <option value="">Select role…</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.role_name ?? r.name}</option>
                    ))}
                  </FieldSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit_dept">Department</FieldLabel>
                  <FieldInput
                    id="edit_dept"
                    list="dept-opts-edit"
                    placeholder="e.g. Cardiology"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                  <datalist id="dept-opts-edit">
                    {departments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit_spec">Specialization</FieldLabel>
                  <FieldInput
                    id="edit_spec"
                    placeholder="e.g. Pediatrics"
                    value={form.specialization}
                    onChange={e => setForm({ ...form, specialization: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit_hire">Hire Date</FieldLabel>
                  <FieldInput
                    id="edit_hire"
                    type="date"
                    value={form.hire_date}
                    onChange={e => setForm({ ...form, hire_date: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit_status">Status</FieldLabel>
                  <FieldSelect
                    id="edit_status"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </FieldSelect>
                </Field>
              </FormGrid>

              <ModalFooter>
                <CancelBtn type="button" onClick={closeModal}>Cancel</CancelBtn>
                <PrimaryBtn type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Changes'}
                </PrimaryBtn>
              </ModalFooter>
            </form>
          </ModalCard>
        </Overlay>
      )}

      {/* ── DELETE MODAL ── */}
      {modal === 'delete' && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>
              Remove Staff Member?
              <IconBtn onClick={closeModal}><CloseOutlined /></IconBtn>
            </ModalTitle>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will deactivate the staff record and the linked user account.
              The record is soft-deleted and can be recovered by your system administrator.
            </p>
            <ModalFooter>
              <CancelBtn onClick={closeModal}>Cancel</CancelBtn>
              <DangerBtn
                style={{ height: 40, padding: '0 18px', fontSize: 14 }}
                disabled={submitting}
                onClick={handleDelete}
              >
                <DeleteOutlined /> Remove
              </DangerBtn>
            </ModalFooter>
          </ModalCard>
        </Overlay>
      )}

    </Page>
  );
}