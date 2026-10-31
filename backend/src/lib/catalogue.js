// Shared availability rules for the catalogue and customer cart.
const visibleShop = {
  status: 'active',
  sellers: { status: 'active', users: { status: 'active', role: 'seller' } },
};
const availableStock = (inventories) =>
  (inventories || []).reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.quantity || 0) - Number(item.reserved_quantity || 0)),
    0,
  );
const mediaOrder = [{ is_thumbnail: 'desc' }, { sort_order: 'asc' }, { media_id: 'asc' }];

module.exports = { visibleShop, availableStock, mediaOrder };
