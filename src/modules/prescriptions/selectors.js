/**
 * Prescription Selectors
 * Never read state.prescriptions.xxx directly in components — use these.
 */

export const selectPrescriptions        = (state) => state.prescriptions;
export const selectPrescriptionList     = (state) => state.prescriptions.list;
export const selectSelectedRx           = (state) => state.prescriptions.selectedRx;
export const selectPrescriptionListLoading = (state) => state.prescriptions.listLoading;
export const selectPrescriptionFormLoading = (state) => state.prescriptions.formLoading;
export const selectPrescriptionError    = (state) => state.prescriptions.error;
export const selectPrescriptionSuccess  = (state) => state.prescriptions.successMessage;