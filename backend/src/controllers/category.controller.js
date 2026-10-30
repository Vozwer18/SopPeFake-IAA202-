const prisma = require('../config/database');
const { action, text, id, HttpError } = require('../lib/validation');
exports.list = action(async (req, res) => {
  const categories = await prisma.categories.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: categories.map(c => ({ id: c.category_id, name: c.name, description: c.description, parentId: c.parent_id })) });
});
exports.create = action(async (req, res) => {
  const name = text(req.body.name, 'Tên danh mục', 100);
  const existing = await prisma.categories.findFirst({ where: { name } });
  if (existing) throw new HttpError(409, 'Danh mục đã tồn tại.');
  const parent_id = req.body.parentId == null || req.body.parentId === '' ? null : id(req.body.parentId);
  if (parent_id && !await prisma.categories.findFirst({ where: { category_id: parent_id, status: 'active' } })) throw new HttpError(400, 'Danh mục cha không tồn tại.');
  const category = await prisma.categories.create({ data: { name, parent_id, description: req.body.description ? text(req.body.description, 'Mô tả', 5000) : null, status: 'active' } });
  res.status(201).json({ success: true, data: { id: category.category_id, name: category.name, description: category.description, parentId: category.parent_id } });
});
