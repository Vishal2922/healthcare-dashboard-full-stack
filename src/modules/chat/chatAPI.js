import axiosClient from '../../services/axiosClient';

/**
 * chatAPI — Module 10: Communication (Notes & Internal Messaging)
 *
 * Thin API layer. Only this file talks to axiosClient.
 * Saga calls these functions via `yield call(...)`.
 *
 * Backend routes (Provider + Nurse roles, CSRF on mutations):
 *   GET    /api/communication/appointments/{id}/notes         → fetchNotesAPI
 *   POST   /api/communication/appointments/{id}/notes         → sendNoteAPI
 *   GET    /api/communication/appointments/{id}/notes/history → fetchHistoryAPI
 *   DELETE /api/communication/notes/{id}                      → deleteNoteAPI
 */

// ─── Fetch Notes for an Appointment ─────────────────────────────────────────
export const fetchNotesAPI = async (appointmentId) => {
  const response = await axiosClient.get(
    `/api/communication/appointments/${appointmentId}/notes`
  );
  return response.data;
  // shape: { message, data: [ ...decryptedNotes ] }
};

// ─── Send (Create) a Note ────────────────────────────────────────────────────
export const sendNoteAPI = async ({ appointmentId, message, note_type = 'note', visible_to_role }) => {
  const body = { message, note_type };
  if (visible_to_role) body.visible_to_role = visible_to_role;

  const response = await axiosClient.post(
    `/api/communication/appointments/${appointmentId}/notes`,
    body
  );
  return response.data;
  // shape: { message, data: { ...decryptedNote } }
};

// ─── Fetch Paginated History ─────────────────────────────────────────────────
export const fetchHistoryAPI = async ({ appointmentId, page = 1, per_page = 20 }) => {
  const response = await axiosClient.get(
    `/api/communication/appointments/${appointmentId}/notes/history`,
    { params: { page, per_page } }
  );
  return response.data;
  // shape: { message, data: { notes: [...], pagination: { total, page, per_page, total_pages } } }
};

// ─── Delete (Soft Delete) a Note ─────────────────────────────────────────────
export const deleteNoteAPI = async (noteId) => {
  const response = await axiosClient.delete(`/api/communication/notes/${noteId}`);
  return response.data;
  // shape: { message: 'Note deleted successfully.' }
};