const prisma = require('../config/database');
const { action, id, HttpError } = require('../lib/validation');
const { visibleShop, availableStock, mediaOrder } = require('../lib/catalogue');

exports.getProducts = action(async (req, res) => {
  const query = String(req.query.q || '')
    .trim()
    .slice(0, 255);
  const products = await prisma.products.findMany({
    where: {
      status: 'active',
      shops: visibleShop,
      ...(query
        ? { OR: [{ name: { contains: query } }, { shops: { shop_name: { contains: query } } }] }
        : {}),
      ...(req.query.categoryId
        ? { product_category_map: { some: { category_id: id(req.query.categoryId, 'Danh mục') } } }
        : {}),
    },
    orderBy: [{ created_at: 'desc' }, { product_id: 'desc' }],
    include: {
      shops: true,
      product_category_map: { include: { categories: true } },
      product_media: { where: { media_type: 'image' }, orderBy: mediaOrder, take: 1 },
      product_variants: {
        where: { status: 'active' },
        orderBy: { variant_id: 'asc' },
        include: { inventories: true },
      },
    },
  });
  const data = products.map((product) => ({
    id: product.product_id,
    categoryIds: product.product_category_map.map((c) => c.category_id),
    categories: product.product_category_map.map((c) => ({
      id: c.category_id,
      name: c.categories.name,
    })),
    name: product.name,
    image: product.product_media[0]?.url || product.product_variants[0]?.image || '',
    price: product.product_variants[0]?.price ?? 0,
    shop: product.shops?.shop_name || '',
    rating: product.rating ?? 0,
    sold: product.sold_quantity || 0,
    stock: product.product_variants.reduce(
      (sum, variant) => sum + availableStock(variant.inventories),
      0,
    ),
  }));
  res.json({ success: true, count: data.length, data });
});

exports.getProductDetail = action(async (req, res) => {
  const product = await prisma.products.findFirst({
    where: { product_id: id(req.params.id), status: 'active', shops: visibleShop },
    include: {
      shops: { select: { shop_id: true, shop_name: true, shop_logo: true, rating: true } },
      product_media: { where: { media_type: 'image' }, orderBy: mediaOrder },
      product_variants: {
        where: { status: 'active' },
        orderBy: { variant_id: 'asc' },
        include: { inventories: true },
      },
      reviews: {
        where: { status: 'visible' },
        orderBy: { created_at: 'desc' },
        include: {
          users: { select: { full_name: true, username: true, avatar: true } },
          review_media: true,
        },
      },
    },
  });
  if (!product) throw new HttpError(404, 'Sản phẩm không tồn tại hoặc không còn được bán.');
  const variants = product.product_variants.map((variant) => ({
    variant_id: variant.variant_id,
    sku: variant.sku,
    price: variant.price,
    image: variant.image,
    stock: availableStock(variant.inventories),
  }));
  res.json({
    success: true,
    data: {
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: variants[0]?.price ?? 0,
      images: product.product_media.map((item) => item.url),
      shop: {
        id: product.shops?.shop_id,
        name: product.shops?.shop_name || '',
        logo: product.shops?.shop_logo || '',
        rating: product.shops?.rating ?? 0,
      },
      variants,
      stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      rating: product.rating ?? 0,
      sold: product.sold_quantity || 0,
      reviewCount: product.reviews.length,
      reviews: product.reviews.map((review) => ({
        id: review.review_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        userName: review.users?.full_name || review.users?.username || 'Người mua',
        avatar: review.users?.avatar || '',
        media: review.review_media.map((media) => media.url).filter(Boolean),
      })),
    },
  });
});
