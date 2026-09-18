const categories = [
   { _id: 'dev-cat-hoodies', name: 'Hoodies', slug: 'hoodies', description: 'Premium hoodies', sortOrder: 1 },
   { _id: 'dev-cat-boots', name: 'Boots', slug: 'boots', description: 'Footwear collection', sortOrder: 2 },
   { _id: 'dev-cat-bags', name: 'Bags', slug: 'bags', description: 'Everyday carry', sortOrder: 3 },
];

const products = [
   {
      _id: 'dev-prod-hoodie',
      name: 'Luzzio Premium Hoodie',
      slug: 'luzzio-premium-hoodie',
      description: 'Heavyweight cotton hoodie with structured fit and minimal branding.',
      price: 8900,
      salePrice: 7900,
      stock: 32,
      categories: [categories[0]],
      category: categories[0],
      images: ['https://placehold.co/600x800/111827/f9fafb?text=Luzzio+Hoodie'],
      colors: ['Black', 'Charcoal'],
      sizes: ['S', 'M', 'L', 'XL'],
      variants: [
         { size: 'S', stock: 8 },
         { size: 'M', stock: 10 },
         { size: 'L', stock: 8 },
         { size: 'XL', stock: 6 },
      ],
      rating: 4.8,
      numReviews: 12,
      createdAt: new Date().toISOString(),
   },
   {
      _id: 'dev-prod-boots',
      name: 'Heritage Leather Boots',
      slug: 'heritage-leather-boots',
      description: 'Hand-finished leather boots built for daily wear.',
      price: 14500,
      salePrice: 0,
      stock: 18,
      categories: [categories[1]],
      category: categories[1],
      images: ['https://placehold.co/600x800/1f2937/f9fafb?text=Leather+Boots'],
      colors: ['Brown', 'Black'],
      sizes: ['40', '41', '42', '43', '44'],
      variants: [
         { size: '40', stock: 3 },
         { size: '41', stock: 4 },
         { size: '42', stock: 5 },
         { size: '43', stock: 4 },
         { size: '44', stock: 2 },
      ],
      rating: 4.6,
      numReviews: 8,
      createdAt: new Date().toISOString(),
   },
   {
      _id: 'dev-prod-bag',
      name: 'Urban Carry Bag',
      slug: 'urban-carry-bag',
      description: 'Compact crossbody bag with water-resistant lining.',
      price: 6200,
      salePrice: 0,
      stock: 25,
      categories: [categories[2]],
      category: categories[2],
      images: ['https://placehold.co/600x800/374151/f9fafb?text=Carry+Bag'],
      colors: ['Olive', 'Sand'],
      sizes: ['One Size'],
      variants: [{ size: 'One Size', stock: 25 }],
      rating: 4.5,
      numReviews: 5,
      createdAt: new Date().toISOString(),
   },
];

function getCategories() {
   return categories;
}

function getProducts(query = {}) {
   let list = [...products];
   const limit = parseInt(query.limit, 10);
   if (limit) list = list.slice(0, limit);
   return list;
}

function getProduct(id) {
   return products.find((p) => p._id === id || p.slug === id) || null;
}

module.exports = { getCategories, getProducts, getProduct };
