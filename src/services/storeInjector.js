let _store = null;

export function setStore(store) {
  _store = store;
}

export function getStore() {
  return _store;
}

let _refreshing = false;

export function getIsRefreshing() {
  return _refreshing;
}

export function setIsRefreshing(value) {
  _refreshing = value;
}