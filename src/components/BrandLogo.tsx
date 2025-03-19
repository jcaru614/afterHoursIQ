import Image from 'next/image';
import React from 'react';

interface BrandLogoProps {
  domain?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ domain }) => {
  const clientId = process.env.NEXT_PUBLIC_BRAND_FETCH_CLIENT_ID;

  const logoUrl = domain ? `https://cdn.brandfetch.io/${domain}/w/400/h/400?c=${clientId}` : '';

  console.log('Client ID:', clientId);
  console.log('Logo URL:', logoUrl);

  const logoSize = 50;

  return (
    <div style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
      {domain && logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${domain} logo`}
          width={logoSize}
          height={logoSize}
          priority
          unoptimized
        />
      ) : (
        <p>No logo</p>
      )}
    </div>
  );
};
export default BrandLogo;
