class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function id(value, label = 'ID') {
  const n = ['number','string'].includes(typeof value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(400, `${label} không hợp lệ.`);
  return n;
}
function text(value, label, max = 255) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpError(400, `${label} là bắt buộc và tối đa ${max} ký tự.`);
  return value.trim();
}
function integer(value, label, min = 0, max = 2147483647) {
  const n = ['number','string'].includes(typeof value) ? Number(value) : NaN;
  if (value === '' || value == null || !Number.isSafeInteger(n) || n < min || n > max) throw new HttpError(400, `${label} không hợp lệ.`);
  return n;
}
function action(fn) { return async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } }; }
module.exports = { HttpError, id, text, integer, action };
