const prisma = require("../config/database");
const { id } = require('../lib/validation');
const visibleShop = {status:'active',sellers:{status:'active',users:{status:'active',role:'seller'}}};

// =============================
// GET ALL PRODUCTS
// =============================
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        status: "active",
        shops: visibleShop,
        ...(req.query.q ? {name:{contains:String(req.query.q).slice(0,255)}} : {}),
        ...(req.query.categoryId ? { product_category_map: { some: { category_id: id(req.query.categoryId, 'Danh mục') } } } : {}),
      },

      include: {
        shops: true,
        product_category_map: {include:{categories:true}},

        product_media: {
          where: {
            is_thumbnail: true,
          },

          take: 1,
        },

        product_variants: {
          where: {
            status: "active",
          },

          take: 1,
        },

        inventories: true,
      },
    });

    const result = products.map((product) => ({
      id: product.product_id,
      categoryIds: product.product_category_map.map(c=>c.category_id),
      categories: product.product_category_map.map(c=>({id:c.category_id,name:c.categories.name})),

      name: product.name,

      image: product.product_media[0]?.url || "",

      price: product.product_variants[0]?.price || 0,

      shop: product.shops?.shop_name || "Unknown",

      rating: product.rating || product.shops?.rating || 0,

      sold: product.sold_quantity || 0,

      stock: product.inventories.reduce((sum, item) => sum + item.quantity, 0),
    }));

    res.json({
      success: true,

      count: result.length,

      data: result,
    });
  } catch (error) {
    console.log(error);

    res.status(error.status || 500).json({ success:false, message:error.status ? error.message : 'Không thể tải sản phẩm.' });
  }
};

// =============================
// GET PRODUCT DETAIL
// =============================
exports.getProductDetail = async (req, res) => {
  try {
    const productId = id(req.params.id);

    const product = await prisma.products.findFirst({
      where: {
        product_id: productId,
        status: "active",
        shops: visibleShop,
      },

      include: {
        shops: {
          select: {
            shop_id: true,

            shop_name: true,

            shop_logo: true,

            rating: true,
          },
        },

        product_media: {
          orderBy: {
            sort_order: "asc",
          },
        },

        product_variants: {
          where: {
            status: "active",
          },
        },

        inventories: true,
        reviews: {
          where: { status: "visible" },
          orderBy: { created_at: "desc" },
          include: { users: { select: { full_name: true, username: true, avatar: true } }, review_media: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,

        message: "Product not found",
      });
    }

    const detail = {
      id: product.product_id,

      name: product.name,

      description: product.description,

      price: product.product_variants[0]?.price || 0,

      images: product.product_media

        .filter((item) => item.media_type === "image")

        .map((item) => item.url),

      shop: {
        id: product.shops?.shop_id || null,

        name: product.shops?.shop_name || "",

        logo: product.shops?.shop_logo || "",

        rating: product.shops?.rating || 0,
      },

      variants: product.product_variants.map((item) => ({
        variant_id: item.variant_id,

        sku: item.sku,

        price: item.price,

        image: item.image,
      })),

      stock: product.inventories.reduce(
        (sum, item) => {
          return sum + item.quantity;
        },

        0,
      ),

      rating: product.rating || product.shops?.rating || 0,

      sold: product.sold_quantity || 0,
      reviewCount: product.reviews?.length || 0,
      reviews: (product.reviews || []).map((review) => ({
        id: review.review_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        userName: review.users?.full_name || review.users?.username || "Người mua",
        avatar: review.users?.avatar || "",
        media: (review.review_media || []).map((m) => m.url).filter(Boolean),
      })),
    };

    res.json({
      success: true,

      data: detail,
    });
  } catch (error) {
    console.log(error);

    res.status(error.status || 500).json({ success:false, message:error.status ? error.message : 'Không thể tải sản phẩm.' });
  }
};
