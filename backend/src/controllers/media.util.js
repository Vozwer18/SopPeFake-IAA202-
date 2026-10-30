const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { HttpError } = require('../lib/validation');
const dir = path.join(__dirname, '../../public/products');
fs.mkdirSync(dir, { recursive: true });
exports.saveImages = (images = []) => {
  if (!Array.isArray(images) || images.length > 8) throw new HttpError(400, 'Mỗi lần tải lên tối đa 8 ảnh.');
  // Validate the full batch before writing any files.
  const files = images.map(item => {
    const data = typeof item === 'string' ? item : item?.data;
    const match = typeof data === 'string' && data.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!match) throw new HttpError(400, 'Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP.');
    const ext = match[1].toLowerCase().replace('jpeg', 'jpg');
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length > 6 * 1024 * 1024) throw new HttpError(400, 'Mỗi ảnh tối đa 6MB.');
    const valid = ext === 'png' ? buf.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : ext === 'jpg' ? buf[0] === 255 && buf[1] === 216 && buf[2] === 255 : buf.subarray(0,4).toString() === 'RIFF' && buf.subarray(8,12).toString() === 'WEBP';
    if (!valid) throw new HttpError(400, 'Dữ liệu ảnh không hợp lệ.');
    return { buf, name: `${randomUUID()}.${ext}` };
  });
  return files.map(({ buf, name }) => { fs.writeFileSync(path.join(dir, name), buf); return `/products/${name}`; });
};
