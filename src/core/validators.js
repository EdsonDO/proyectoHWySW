export function createValidator(formRoot = document) {
  let hasError = false;

  const valueOf = key => {
    const el = formRoot.querySelector(`#f_${key}`);
    return el ? el.value.trim() : '';
  };

  const setError = (key, message) => {
    const errEl = formRoot.querySelector(`#e_${key}`);
    const fieldEl = formRoot.querySelector(`#f_${key}`);
    if (errEl) errEl.textContent = message || '';
    if (fieldEl) fieldEl.classList.toggle('err', Boolean(message));
    if (message) hasError = true;
    return Boolean(message);
  };

  const check = (key, condition, message) => {
    setError(key, condition ? message : '');
  };

  const isValid = () => !hasError;

  return { valueOf, setError, check, isValid };
}

export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,24}$/;
export const STORAGE_PATTERN = /^(HDD|SSD|NVMe)\s+\d+(\.\d+)?\s?(GB|TB)$/i;
