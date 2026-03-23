import {
  all,
  call,
  put,
  takeLatest,
  takeEvery,
} from 'redux-saga/effects';

import {
  fetchNotesAPI,
  createNoteAPI,
  fetchNoteHistoryAPI,
  deleteNoteAPI,
} from './communicationAPI';

import {
  fetchNotesRequest,
  fetchNotesSuccess,
  fetchNotesFailure,
  createNoteRequest,
  createNoteSuccess,
  createNoteFailure,
  fetchNoteHistoryRequest,
  fetchNoteHistorySuccess,
  fetchNoteHistoryFailure,
  deleteNoteRequest,
  deleteNoteSuccess,
  deleteNoteFailure,
} from './communicationSlice';

// ─── Helper ──────────────────────────────────────────────────────────────────
const errMsg = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

// ════════════════════════════════════════════════════════════════════════════
// 1. FETCH NOTES
//    GET /api/communication/appointments/{id}/notes
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchNotes(action) {
  try {
    const appointmentId = action.payload;
    const response      = yield call(fetchNotesAPI, appointmentId);
    const data          = response?.data ?? response;
    yield put(fetchNotesSuccess(Array.isArray(data) ? data : data.notes ?? []));
  } catch (error) {
    yield put(fetchNotesFailure(errMsg(error, 'Failed to load notes.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. CREATE NOTE
//    POST /api/communication/appointments/{id}/notes
// ════════════════════════════════════════════════════════════════════════════
function* handleCreateNote(action) {
  try {
    const { appointmentId, ...noteData } = action.payload;
    const response = yield call(createNoteAPI, appointmentId, noteData);
    const data     = response?.data ?? response;
    yield put(createNoteSuccess(data));
  } catch (error) {
    yield put(createNoteFailure(errMsg(error, 'Failed to create note.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. FETCH NOTE HISTORY
//    GET /api/communication/appointments/{id}/notes/history
// ════════════════════════════════════════════════════════════════════════════
function* handleFetchNoteHistory(action) {
  try {
    const { appointmentId, page = 1, per_page = 20 } = action.payload;
    const response = yield call(fetchNoteHistoryAPI, appointmentId, { page, per_page });
    const data     = response?.data ?? response;
    yield put(fetchNoteHistorySuccess({
      notes:      data.notes      ?? [],
      pagination: data.pagination ?? { total: 0, page, per_page, total_pages: 0 },
    }));
  } catch (error) {
    yield put(fetchNoteHistoryFailure(errMsg(error, 'Failed to load note history.')));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. DELETE NOTE
//    DELETE /api/communication/notes/{id}
// ════════════════════════════════════════════════════════════════════════════
function* handleDeleteNote(action) {
  const id = action.payload;
  try {
    yield call(deleteNoteAPI, id);
    yield put(deleteNoteSuccess(id));
  } catch (error) {
    yield put(
      deleteNoteFailure({
        id,
        message: errMsg(error, 'Failed to delete note.'),
      })
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT COMMUNICATION SAGA
// ════════════════════════════════════════════════════════════════════════════
export default function* communicationSaga() {
  yield all([
    takeLatest(fetchNotesRequest.type,       handleFetchNotes),
    takeLatest(createNoteRequest.type,       handleCreateNote),
    takeLatest(fetchNoteHistoryRequest.type,  handleFetchNoteHistory),
    takeEvery(deleteNoteRequest.type,        handleDeleteNote),
  ]);
}
