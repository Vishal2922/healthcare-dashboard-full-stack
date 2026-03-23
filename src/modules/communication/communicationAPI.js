import axiosClient from '../../services/axiosClient';

/**
 * communicationAPI — Module 7: Communication Notes
 *
 * API layer for appointment-based notes.
 * Talks to backend Communication module endpoints.
 *
 * Backend routes (Provider, Nurse):
 *   GET    /api/communication/appointments/{id}/notes         → list notes
 *   POST   /api/communication/appointments/{id}/notes         → create note
 *   GET    /api/communication/appointments/{id}/notes/history → paginated history
 *   DELETE /api/communication/notes/{id}                      → delete note
 */

// ─── Fetch Notes for an Appointment ──────────────────────────────────────────
export const fetchNotesAPI = async (appointmentId) => {
  const response = await axiosClient.get(
    `/api/communication/appointments/${appointmentId}/notes`
  );
  return response.data;
  // shape: { message, data: [...notes] }
};

// ─── Create a Note ───────────────────────────────────────────────────────────
export const createNoteAPI = async (appointmentId, data) => {
  const response = await axiosClient.post(
    `/api/communication/appointments/${appointmentId}/notes`,
    data
  );
  return response.data;
  // shape: { message, data: { ...note } }
};

// ─── Fetch Paginated Note History ────────────────────────────────────────────
export const fetchNoteHistoryAPI = async (appointmentId, { page = 1, per_page = 20 } = {}) => {
  const response = await axiosClient.get(
    `/api/communication/appointments/${appointmentId}/notes/history`,
    { params: { page, per_page } }
  );
  return response.data;
  // shape: { message, data: { notes: [...], pagination: {...} } }
};

// ─── Delete a Note ───────────────────────────────────────────────────────────
export const deleteNoteAPI = async (noteId) => {
  const response = await axiosClient.delete(
    `/api/communication/notes/${noteId}`
  );
  return response.data;
  // shape: { message }
};
