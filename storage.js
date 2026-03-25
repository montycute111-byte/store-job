import { SAVE_KEY } from "./data.js";
import { normalizeState } from "./state.js";

export function loadGameState() {
  try {
    const rawValue = window.localStorage.getItem(SAVE_KEY);
    if (!rawValue) {
      return {
        state: normalizeState(null),
        source: "new"
      };
    }

    const parsed = JSON.parse(rawValue);
    const state = normalizeState(parsed);
    state.saveMeta.lastLoadedAt = Date.now();
    return {
      state,
      source: "save"
    };
  } catch (error) {
    console.error("Failed to load local store save", error);
    return {
      state: normalizeState(null),
      source: "recovered"
    };
  }
}

export function saveGameState(state, label = "Saved locally") {
  try {
    state.saveMeta.lastSavedAt = Date.now();
    state.saveMeta.lastAutoSaveLabel = label;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return {
      ok: true,
      label
    };
  } catch (error) {
    console.error("Failed to save local store game", error);
    return {
      ok: false,
      label: "Local save failed"
    };
  }
}

export function clearSavedGameState() {
  window.localStorage.removeItem(SAVE_KEY);
}
