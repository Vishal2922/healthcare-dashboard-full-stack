/**
 * Billing Selectors — Module 11
 * Never read state.billing.xxx directly in components — use these.
 */

export const selectBilling              = (state) => state.billing;
export const selectInvoiceList          = (state) => state.billing.invoices;
export const selectSelectedInvoice      = (state) => state.billing.selectedInvoice;
export const selectBillingSummary       = (state) => state.billing.summary;
export const selectBillingMeta          = (state) => state.billing.meta;
export const selectBillingFilters       = (state) => state.billing.filters;
export const selectBillingListLoading   = (state) => state.billing.listLoading;
export const selectBillingDetailLoading = (state) => state.billing.detailLoading;
export const selectBillingFormLoading   = (state) => state.billing.formLoading;
export const selectBillingSummaryLoading= (state) => state.billing.summaryLoading;
export const selectBillingPrefetched    = (state) => state.billing.prefetched;
export const selectBillingError         = (state) => state.billing.error;
export const selectBillingSuccess       = (state) => state.billing.successMessage;
export const selectBillingOfflineQueue  = (state) => state.billing.offlineQueue;
export const selectBillingIsOnline      = (state) => state.billing.isOnline;
export const selectBillingIsFlushing    = (state) => state.billing.isFlushing;
