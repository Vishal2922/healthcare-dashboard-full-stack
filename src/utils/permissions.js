export const ROLES = {
  ADMIN:        'Admin',
  PROVIDER:     'Provider',
  NURSE:        'Nurse',
  RECEPTIONIST: 'Receptionist',
  PHARMACIST:   'Pharmacist',
  PATIENT:      'Patient',
};

export const PERMISSIONS = {

  // FIX: was ['Provider','Nurse'] — must match backend clinicStaff
  patients: {
    view:   ['Admin', 'Provider', 'Nurse', 'Receptionist'],
    create: ['Admin', 'Provider', 'Nurse', 'Receptionist'],
    edit:   ['Admin', 'Provider', 'Nurse', 'Receptionist'],
    delete: ['Admin'],
  },

  appointments: {
    view:         ['Provider', 'Nurse', 'Patient'],
    create:       ['Provider', 'Nurse', 'Patient'],
    edit:         ['Provider', 'Nurse'],
    cancel:       ['Provider', 'Patient'],
    updateStatus: ['Provider', 'Nurse'],
  },

  prescriptions: {
    view:     ['Admin', 'Provider', 'Pharmacist'],
    create:   ['Provider'],
    update:   ['Provider', 'Pharmacist'],
    dispense: ['Pharmacist'],
  },

  billing: {
    view:         ['Receptionist', 'Patient', 'Provider'],
    create:       ['Provider'],
    edit:         ['Provider', 'Patient'],
    delete:       [],
    updateStatus: ['Provider', 'Patient'],
  },

  staff: {
    view:         ['Admin'],
    create:       ['Admin'],
    edit:         ['Admin'],
    delete:       ['Admin'],
    toggleActive: ['Admin'],
  },

  users: {
    view:          ['Admin'],
    create:        ['Admin'],
    edit:          ['Admin'],
    delete:        ['Admin'],
    assignRole:    ['Admin'],
    resetPassword: ['Admin'],
  },

  communication: {
    view:   ['Provider', 'Nurse'],
    create: ['Provider', 'Nurse'],
    delete: ['Provider'],
  },

  calendar: {
    view: ['Receptionist'],
  },

  dashboard: {
    view: ['Admin', 'Provider', 'Pharmacist', 'Nurse', 'Receptionist', 'Patient'],
  },

  settings: {
    view:   ['Admin'],
    manage: ['Admin'],
  },
};

export function can(module, action, userRole) {
  if (!userRole) return false;
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowed = modulePerms[action];
  if (!allowed) return false;
  return allowed.includes(userRole);
}