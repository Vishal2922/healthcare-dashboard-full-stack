import {
  all,
  call,
  put,
  takeLatest,
  takeEvery,
} from 'redux-saga/effects';

import {
  fetchNotesAPI,
  sendNoteAPI,
  fetchHistoryAPI,
  deleteNoteAPI,
} from './chatAPI';

import {
  fetchNotesRequest,
  fetchNotesSuccess,
  fetchNotesFailure,
  fetchHistoryRequest,
  fetchHistorySuccess,
  fetchHistoryFailure,
  sendNoteRequest,
  sendNoteSuccess,
  sendNoteFailure,
  deleteNoteRequest,
  deleteNoteSuccess,
  deleteNoteFailure,
} from './chatSlice';

// ─── Helper ──────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH NOTES
//    GET /api/communication/appointments/{id}/notes
//    Returns decrypted notes filtered by the current user's role visibility.
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchNotes(action) {
  try {
    const { appointmentId } = action.payload;
    const response = yield call(fetchNotesAPI, appointmentId);

    // Backend returns: { message, data: [...notes] }
    const notes = response?.data ?? response ?? [];
    yield put(fetchNotesSuccess(Array.isArray(notes) ? notes : []));
  } catch (error) {
    yield put(fetchNotesFailure(errMsg(error, 'Failed to load notes.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. FETCH HISTORY (paginated)
//    GET /api/communication/appointments/{id}/notes/history
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchHistory(action) {
  try {
    const { appointmentId, page = 1, per_page = 20 } = action.payload;
    const response = yield call(fetchHistoryAPI, { appointmentId, page, per_page });

    // Backend returns: { message, data: { notes: [...], pagination: {...} } }
    const data = response?.data ?? response;
    yield put(
      fetchHistorySuccess({
        notes:      data.notes      ?? [],
        pagination: data.pagination ?? {
          total:       0,
          page,
          per_page,
          total_pages: 0,
        },
      })
    );
  } catch (error) {
    yield put(fetchHistoryFailure(errMsg(error, 'Failed to load message history.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. SEND NOTE
//    POST /api/communication/appointments/{id}/notes
//    Creates an encrypted note. Backend enforces Provider|Nurse role.
// ════════════════════════════════════════════════════════════════════════════
function* handleSendNote(action) {
  try {
    const response = yield call(sendNoteAPI, action.payload);

    // Backend returns: { message, data: { ...decryptedNote } }
    const note = response?.data ?? response;
    yield put(sendNoteSuccess(note));
  } catch (error) {
    yield put(sendNoteFailure(errMsg(error, 'Failed to send note.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. DELETE NOTE
//    DELETE /api/communication/notes/{id}
//    Soft-delete — backend enforces author or Admin only.
//    Uses takeEvery so multiple notes can be deleted concurrently.
// ════════════════════════════════════════════════════════════════════════════
function* handleDeleteNote(action) {
  const noteId = action.payload;
  try {
    yield call(deleteNoteAPI, noteId);
    yield put(deleteNoteSuccess(noteId));
  } catch (error) {
    yield put(
      deleteNoteFailure({
        noteId,
        message: errMsg(error, 'Failed to delete note.'),
      })
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT CHAT SAGA
// ════════════════════════════════════════════════════════════════════════════
export default function* chatSaga() {
  yield all([
    takeLatest(fetchNotesRequest.type,   handleFetchNotes),
    takeLatest(fetchHistoryRequest.type, handleFetchHistory),
    takeLatest(sendNoteRequest.type,     handleSendNote),
    // takeEvery so parallel deletes don't cancel each other
    takeEvery(deleteNoteRequest.type,    handleDeleteNote),
  ]);
}