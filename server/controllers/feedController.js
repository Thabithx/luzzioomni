const Product = require('../models/Product');

// Helper to escape XML special characters
const escapeXml = (unsafe) => {
   if (!unsafe) return '';
   return unsafe.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
};

// Start of XML Feed
const FEED_HEADER = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Luzzio Product Feed</title>
<link>${process.env.CLIENT_URL || 'https://luzziopremium.com'}</link>
<description>Premium Lifestyle Products</description>
`;

const FEED_FOOTER = `
</channel>
</rss>`;

exports.getFacebookFeed = async (req, res) => {
   try {
      // Fetch all products
      const products = await Product.find({}).sort({ createdAt: -1 });

      let itemsXml = '';
      const baseUrl = process.env.CLIENT_URL || 'https://luzziopremium.com';

      // Ensure no trailing slash for clean concatenation
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      for (const product of products) {
         // SKIP invalid products
         if (!product.stock && product.stock !== 0) continue; // Must have stock defined (even if 0)
         if (!product.price) continue;
         if (!product.images || product.images.length === 0) continue;

         // Required Fields
         const id = product._id.toString();
         const title = escapeXml(product.name);
         const description = escapeXml(product.description || product.name);

         // Generate Product URL - Match site structure: /products/:id
         const link = `${cleanBaseUrl}/products/${id}`;

         // Image needs HTTPS
         let imageLink = product.images[0];
         if (imageLink && !imageLink.startsWith('http')) {
            // Handle relative paths if any (though usually Cloudinary links are full URLs)
            imageLink = `${cleanBaseUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
         }
         imageLink = escapeXml(imageLink);

         // Price with currency
         const price = `${product.price.toFixed(2)} LKR`;

         // Availability
         const availability = product.stock > 0 ? 'in_stock' : 'out_of_stock';

         // Optional: Brand (Static for now or from schema if exists)
         const brand = 'Luzzio';

         // Build Item XML
         itemsXml += `
<item>
<g:id>${id}</g:id>
<g:title>${title}</g:title>
<g:description>${description}</g:description>
<g:link>${link}</g:link>
<g:image_link>${imageLink}</g:image_link>
<g:brand>${brand}</g:brand>
<g:condition>new</g:condition>
<g:availability>${availability}</g:availability>
<g:price>${price}</g:price>
</item>`;
      }

      const fullFeed = FEED_HEADER + itemsXml + FEED_FOOTER;

      // Set content type to XML
      res.set('Content-Type', 'application/xml');
      res.send(fullFeed);

   } catch (err) {
      console.error('Feed generation error:', err);
      res.status(500).send('Error generating product feed');
   }
};
