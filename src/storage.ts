// Browser-local persistence (ADR-0002: key lives in localStorage until "Forget key").
// Every access is guarded: storage can throw in private windows or with site data blocked,
// in which case the app still works — the key just isn't remembered.

const KEY_ITEM = 'openrouter-api-key';
const MODEL_ITEM = 'openrouter-model';

function get(item: string): string | null {
  try {
    return localStorage.getItem(item);
  } catch {
    return null;
  }
}

function set(item: string, value: string): void {
  try {
    localStorage.setItem(item, value);
  } catch {
    /* not remembered; still usable this session */
  }
}

export const loadKey = () => get(KEY_ITEM);
export const saveKey = (key: string) => set(KEY_ITEM, key);
export function forgetKey(): void {
  try {
    localStorage.removeItem(KEY_ITEM);
  } catch {
    /* nothing stored */
  }
}

export const loadModel = () => get(MODEL_ITEM);
export const saveModel = (model: string) => set(MODEL_ITEM, model);
