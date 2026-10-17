import React from 'react';
import { Helmet } from 'react-helmet-async';

const Meta = ({ title, description, keywords }) => {
   const siteTitle = 'Luzzio';
   const fullTitle = title ? `${title} | ${siteTitle}` : 'Luzzio | Luxury Redefined';
   const defaultDescription = 'Luzzio Luxury E-commerce platform inspired by high-end fashion.';
   const defaultKeywords = 'luxury, fashion, e-commerce, designer, clothing';

   return (
      <Helmet>
         <title>{fullTitle}</title>
         <meta name="description" content={description || defaultDescription} />
         <meta name="keywords" content={keywords || defaultKeywords} />

         {/* Open Graph */}
         <meta property="og:title" content={fullTitle} />
         <meta property="og:description" content={description || defaultDescription} />
         <meta property="og:type" content="website" />

         {/* Twitter */}
         <meta name="twitter:card" content="summary_large_image" />
         <meta name="twitter:title" content={fullTitle} />
         <meta name="twitter:description" content={description || defaultDescription} />
      </Helmet>
   );
};

export default Meta;
