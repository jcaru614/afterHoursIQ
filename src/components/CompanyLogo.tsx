import Image from 'next/image';
import React from 'react';

interface CompanyLogoProps {
  domain?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ domain }) => {
  const clientId = process.env.NEXT_PUBLIC_BRAND_FETCH_CLIENT_ID;
  const logoUrl = domain ? `https://cdn.brandfetch.io/${domain}/w/400/h/400?c=${clientId}` : '';
  const logoSize = 60;

  return (
    <div style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
      {domain && logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${domain} logo`}
          width={logoSize}
          height={logoSize}
          className="rounded-md"
          priority
          unoptimized
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md shadow-md bg-[#31245C]"
          style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
        >
          <span className="text-xs text-white/50">Logo</span>
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
