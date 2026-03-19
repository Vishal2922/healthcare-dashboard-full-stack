/**
 * Patient Selectors — Module 8
 * Never read state.patients.xxx directly in components — use these.
 */

export const selectPatients            = (state) => state.patients;
export const selectPatientList         = (state) => state.patients.list;
export const selectSelectedPatient     = (state) => state.patients.selectedPatient;
export const selectPatientMeta         = (state) => state.patients.meta;
export const selectPatientFilters      = (state) => state.patients.filters;
export const selectPatientListLoading  = (state) => state.patients.listLoading;
export const selectPatientDetailLoading= (state) => state.patients.detailLoading;
export const selectPatientFormLoading  = (state) => state.patients.formLoading;
export const selectPatientPrefetched   = (state) => state.patients.prefetched;
export const selectPatientError        = (state) => state.patients.error;
export const selectPatientSuccess      = (state) => state.patients.successMessage;
export const selectPatientOfflineQueue = (state) => state.patients.offlineQueue;
export const selectPatientIsOnline     = (state) => state.patients.isOnline;
export const selectPatientIsFlushing   = (state) => state.patients.isFlushing;
