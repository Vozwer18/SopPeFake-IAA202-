const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { HttpError } = require('../lib/validation');
const prisma = require('../config/database');
const dir = path.join(__dirname, '../../public/products');
const storage = process.env.MEDIA_STORAGE || 'filesystem';
if (!['filesystem', 'database'].includes(storage)) throw new Error('MEDIA_STORAGE must be filesystem or database.');
if (storage === 'filesystem') fs.mkdirSync(dir, { recursive: true });
exports.saveImages = async (images = []) => {
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
    return { buf, name: `${randomUUID()}.${ext}`, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` };
  });
  if (storage === 'database') {
    if (files.length) await prisma.uploaded_images.createMany({
      data: files.map(({ buf, name, contentType }) => ({ filename: name, content: buf, content_type: contentType })),
    });
    return files.map(({ name }) => `/products/${name}`);
  }
  return files.map(({ buf, name }) => { fs.writeFileSync(path.join(dir, name), buf); return `/products/${name}`; });
};

// Database images keep the same public URLs as filesystem uploads.
exports.serveImage = async (req, res, next) => {
  if (storage !== 'database' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp)$/.test(req.params.filename)) return next();
  try {
    const image = await prisma.uploaded_images.findUnique({ where: { filename: req.params.filename } });
    if (!image) return next();
    res.set('Cache-Control', 'public, max-age=86400, immutable');
    res.type(image.content_type).send(Buffer.from(image.content));
  } catch (error) { next(error); }
};
