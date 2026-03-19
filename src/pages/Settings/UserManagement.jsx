import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  UserAddOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, CheckCircleOutlined, StopOutlined,
  CloseOutlined, TeamOutlined,
} from '@ant-design/icons';
import useUsers from '../../modules/users/hooks/useUsers';

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`to{transform:rotate(360deg)}`;
const shake  = keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}`;

const Page        = styled.div`padding:2rem;max-width:1200px;margin:0 auto;animation:${fadeUp} 0.4s ease both;font-family:'DM Sans',sans-serif;`;
const PageHeader  = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;`;
const PageTitle   = styled.h1`font-size:22px;font-weight:600;color:#0e1b2a;margin:0;display:flex;align-items:center;gap:10px;`;
const TitleIcon   = styled.span`width:36px;height:36px;border-radius:10px;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;`;
const Toolbar     = styled.div`display:flex;gap:12px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;`;
const SearchWrap  = styled.div`position:relative;flex:1;min-width:200px;max-width:320px;`;
const SearchIcon  = styled.span`position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#b0bac4;font-size:15px;`;
const SearchInput = styled.input`width:100%;height:40px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px 0 36px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;transition:border-color 0.18s,box-shadow 0.18s;&::placeholder{color:#b0bac4;}&:focus{border-color:#20b486;box-shadow:0 0 0 3px rgba(32,180,134,0.12);}`;
const FilterSelect = styled.select`height:40px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;cursor:pointer;&:focus{border-color:#20b486;}`;
const Btn         = styled.button`display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.18s,transform 0.12s;&:active{transform:scale(0.97);}`;
const PrimaryBtn  = styled(Btn)`background:#0e1b2a;color:white;&:hover{background:#1a2d43;}`;
const DangerBtn   = styled(Btn)`background:#fff5f5;color:#c53030;border:1.5px solid #fed7d7;height:32px;padding:0 12px;font-size:13px;&:hover{background:#fed7d7;}`;
const SuccessBtn  = styled(Btn)`background:#f0fff4;color:#276749;border:1.5px solid #c6f6d5;height:32px;padding:0 12px;font-size:13px;&:hover{background:#c6f6d5;}`;
const IconBtn     = styled.button`width:32px;height:32px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;color:#718096;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.15s;&:hover{border-color:#20b486;color:#20b486;}`;
const TableWrap   = styled.div`background:white;border-radius:14px;border:1.5px solid #e2e8f0;overflow:hidden;`;
const Table       = styled.table`width:100%;border-collapse:collapse;`;
const Th          = styled.th`text-align:left;padding:12px 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#718096;background:#f7f9fb;border-bottom:1.5px solid #e2e8f0;`;
const Td          = styled.td`padding:14px 16px;font-size:14px;color:#2d3748;border-bottom:1px solid #f0f4f8;vertical-align:middle;`;
const Tr          = styled.tr`transition:background 0.12s;&:hover td{background:#f7f9fb;}&:last-child td{border-bottom:none;}`;
const CenterCell  = styled.td`text-align:center;padding:3rem 1rem;color:#a0aab4;font-size:14px;`;
const Spinner     = styled.div`width:24px;height:24px;border:2.5px solid #e2e8f0;border-top-color:#20b486;border-radius:50%;animation:${spin} 0.7s linear infinite;margin:0 auto;`;
const ErrorBanner = styled.div`background:#fff5f5;border:1.5px solid #fed7d7;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;color:#c53030;animation:${shake} 0.4s ease;`;
const Badge       = styled.span`display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 10px;border-radius:99px;font-size:11px;font-weight:600;background:${({$variant})=>$variant==='active'?'#f0fff4':$variant==='inactive'?'#fff5f5':$variant==='admin'?'#ebf4ff':$variant==='provider'?'#faf5ff':'#f7f9fb'};color:${({$variant})=>$variant==='active'?'#276749':$variant==='inactive'?'#c53030':$variant==='admin'?'#2b6cb0':$variant==='provider'?'#6b46c1':'#4a5568'};border:1px solid ${({$variant})=>$variant==='active'?'#c6f6d5':$variant==='inactive'?'#fed7d7':$variant==='admin'?'#bee3f8':$variant==='provider'?'#e9d8fd':'#e2e8f0'};`;
const AvatarRow   = styled.div`display:flex;align-items:center;gap:10px;`;
const Avatar      = styled.div`width:34px;height:34px;border-radius:50%;background:#0e1b2a;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;`;
const AvatarName  = styled.div`font-weight:500;font-size:14px;color:#0e1b2a;`;
const AvatarSub   = styled.div`font-size:12px;color:#718096;`;
const ActionRow   = styled.div`display:flex;align-items:center;gap:8px;`;
const Overlay     = styled.div`position:fixed;inset:0;background:rgba(14,27,42,0.45);display:flex;align-items:center;justify-content:center;z-index:999;padding:1rem;`;
const ModalCard   = styled.div`background:white;border-radius:16px;padding:2rem;width:100%;max-width:480px;animation:${fadeUp} 0.3s ease both;`;
const ModalTitle  = styled.h2`font-size:18px;font-weight:600;color:#0e1b2a;margin:0 0 1.5rem;`;
const FormGrid    = styled.div`display:flex;flex-direction:column;gap:16px;margin-bottom:1.5rem;`;
const FieldLabel  = styled.label`display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#4a5568;margin-bottom:6px;`;
const FieldInput  = styled.input`width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;outline:none;transition:border-color 0.18s;&:focus{border-color:#20b486;box-shadow:0 0 0 3px rgba(32,180,134,0.12);}`;
const FieldSelect = styled.select`width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0e1b2a;background:white;outline:none;cursor:pointer;&:focus{border-color:#20b486;}`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;`;
const CancelBtn   = styled(Btn)`background:#f7f9fb;color:#4a5568;border:1.5px solid #e2e8f0;&:hover{background:#edf2f7;}`;
const PaginationRow = styled.div`display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-top:1.5px solid #e2e8f0;font-size:13px;color:#718096;`;
const PageBtns    = styled.div`display:flex;gap:6px;`;
const PageBtn     = styled.button`width:32px;height:32px;border:1.5px solid ${({$active})=>$active?'#20b486':'#e2e8f0'};border-radius:8px;background:${({$active})=>$active?'#20b486':'white'};color:${({$active})=>$active?'white':'#4a5568'};font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;&:hover:not(:disabled){border-color:#20b486;}&:disabled{opacity:0.4;cursor:not-allowed;}`;

const getInitials = (name='') => name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const roleBadgeVariant = (role='') => { const r=role.toLowerCase(); if(r==='admin')return'admin'; if(r==='provider'||r==='doctor')return'provider'; return'default'; };
const EMPTY_FORM = { user_id:'', role_id:'', department:'', specialization:'', hire_date:'', status:'active' };

export default function UserManagement() {
  const {
    users, pagination, loading, submitting, error,
    roles, departments,
    fetchUsers, createUser, updateUser, deleteUser, toggleStatus,
    fetchRoles, fetchDepartments, dismissError,
  } = useUsers();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [editId,       setEditId]       = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);

  useEffect(() => { fetchUsers(); fetchRoles(); fetchDepartments(); }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers({ search, status: statusFilter, role_id: roleFilter, page: 1 });
    }, 380);
    return () => clearTimeout(t);
  }, [search, statusFilter, roleFilter]); // eslint-disable-line

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal('create'); };
  const openEdit   = (user) => {
    setForm({ user_id: user.user_id??user.id, role_id: user.role_id??'', department: user.department??'', specialization: user.specialization??'', hire_date: user.hire_date??'', status: user.status??'active' });
    setEditId(user.id); setModal('edit');
  };
  const openDelete = (id) => { setDeleteId(id); setModal('delete'); };
  const closeModal = () => { setModal(null); setEditId(null); setDeleteId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modal === 'create') createUser(form);
    else if (modal === 'edit') updateUser({ id: editId, ...form });
    closeModal();
  };
  const handleDelete = () => { deleteUser(deleteId); closeModal(); };
  const handleToggle = (user) => toggleStatus(user.id, user.user_status ?? user.status);
  const handlePage   = (page) => fetchUsers({ page });

  return (
    <Page>
      <PageHeader>
        <PageTitle><TitleIcon><TeamOutlined /></TitleIcon>User Management</PageTitle>
        <PrimaryBtn onClick={openCreate}><UserAddOutlined />Add Staff Member</PrimaryBtn>
      </PageHeader>

      {error && (
        <ErrorBanner>{error}<IconBtn onClick={dismissError}><CloseOutlined /></IconBtn></ErrorBanner>
      )}

      <Toolbar>
        <SearchWrap>
          <SearchIcon><SearchOutlined /></SearchIcon>
          <SearchInput placeholder="Search by name or username…" value={search} onChange={e=>setSearch(e.target.value)} />
        </SearchWrap>
        <FilterSelect value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <FilterSelect value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {roles.map(r=><option key={r.id} value={r.id}>{r.role_name??r.name}</option>)}
        </FilterSelect>
      </Toolbar>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Staff Member</Th><Th>Role</Th><Th>Department</Th>
              <Th>Hire Date</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><CenterCell colSpan={6}><Spinner /></CenterCell></tr>
            ) : users.length === 0 ? (
              <tr><CenterCell colSpan={6}>No staff members found.</CenterCell></tr>
            ) : users.map(user => {
              const name   = user.full_name??user.username??'—';
              const email  = user.email??'—';
              const role   = user.role_name??'—';
              const dept   = user.department??'—';
              const hire   = user.hire_date??'—';
              const status = user.user_status??user.status??'inactive';
              return (
                <Tr key={user.id}>
                  <Td>
                    <AvatarRow>
                      <Avatar>{getInitials(name)}</Avatar>
                      <div><AvatarName>{name}</AvatarName><AvatarSub>{email}</AvatarSub></div>
                    </AvatarRow>
                  </Td>
                  <Td><Badge $variant={roleBadgeVariant(role)}>{role}</Badge></Td>
                  <Td>{dept}</Td>
                  <Td>{hire}</Td>
                  <Td>
                    <Badge $variant={status}>
                      {status==='active'?<CheckCircleOutlined />:<StopOutlined />} {status}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionRow>
                      <IconBtn title="Edit" onClick={()=>openEdit(user)}><EditOutlined /></IconBtn>
                      {status==='active'
                        ? <DangerBtn disabled={submitting} onClick={()=>handleToggle(user)}><StopOutlined />Deactivate</DangerBtn>
                        : <SuccessBtn disabled={submitting} onClick={()=>handleToggle(user)}><CheckCircleOutlined />Activate</SuccessBtn>
                      }
                      <IconBtn title="Delete" style={{color:'#c53030',borderColor:'#fed7d7'}} onClick={()=>openDelete(user.id)}><DeleteOutlined /></IconBtn>
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
              <PageBtn disabled={pagination.page<=1} onClick={()=>handlePage(pagination.page-1)}>‹</PageBtn>
              {Array.from({length:pagination.total_pages},(_,i)=>i+1)
                .filter(p=>p===1||p===pagination.total_pages||Math.abs(p-pagination.page)<=1)
                .map(p=><PageBtn key={p} $active={p===pagination.page} onClick={()=>handlePage(p)}>{p}</PageBtn>)}
              <PageBtn disabled={pagination.page>=pagination.total_pages} onClick={()=>handlePage(pagination.page+1)}>›</PageBtn>
            </PageBtns>
          </PaginationRow>
        )}
      </TableWrap>

      {(modal==='create'||modal==='edit') && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <ModalTitle>{modal==='create'?'Add Staff Member':'Edit Staff Record'}</ModalTitle>
            <form onSubmit={handleSubmit}>
              <FormGrid>
                {modal==='create' && (
                  <div>
                    <FieldLabel htmlFor="user_id">User ID *</FieldLabel>
                    <FieldInput id="user_id" type="number" placeholder="Existing user ID" value={form.user_id} onChange={e=>setForm({...form,user_id:e.target.value})} required />
                  </div>
                )}
                <div>
                  <FieldLabel htmlFor="role_id">Role</FieldLabel>
                  <FieldSelect id="role_id" value={form.role_id} onChange={e=>setForm({...form,role_id:e.target.value})}>
                    <option value="">Select role…</option>
                    {roles.map(r=><option key={r.id} value={r.id}>{r.role_name??r.name}</option>)}
                  </FieldSelect>
                </div>
                <div>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <FieldInput id="department" list="dept-opts" placeholder="e.g. Cardiology" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} />
                  <datalist id="dept-opts">{departments.map(d=><option key={d} value={d}/>)}</datalist>
                </div>
                <div>
                  <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                  <FieldInput id="specialization" placeholder="e.g. Pediatrics" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} />
                </div>
                <div>
                  <FieldLabel htmlFor="hire_date">Hire Date</FieldLabel>
                  <FieldInput id="hire_date" type="date" value={form.hire_date} onChange={e=>setForm({...form,hire_date:e.target.value})} />
                </div>
                <div>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <FieldSelect id="status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </FieldSelect>
                </div>
              </FormGrid>
              <ModalFooter>
                <CancelBtn type="button" onClick={closeModal}>Cancel</CancelBtn>
                <PrimaryBtn type="submit" disabled={submitting}>
                  {submitting?'Saving…':modal==='create'?'Add Staff':'Save Changes'}
                </PrimaryBtn>
              </ModalFooter>
            </form>
          </ModalCard>
        </Overlay>
      )}

      {modal==='delete' && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <ModalTitle>Remove Staff Member?</ModalTitle>
            <p style={{fontSize:14,color:'#4a5568',marginBottom:'1.5rem',lineHeight:1.6}}>
              This will deactivate the staff record and the linked user account. The record is soft-deleted and can be recovered by your system administrator.
            </p>
            <ModalFooter>
              <CancelBtn onClick={closeModal}>Cancel</CancelBtn>
              <DangerBtn style={{height:40,padding:'0 18px',fontSize:14}} disabled={submitting} onClick={handleDelete}>
                <DeleteOutlined /> Remove
              </DangerBtn>
            </ModalFooter>
          </ModalCard>
        </Overlay>
      )}
    </Page>
  );
}