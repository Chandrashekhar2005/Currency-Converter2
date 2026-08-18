import React, { useState } from 'react';

interface CurrencyFlagProps {
  countryCode: string;
  flagEmoji: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CurrencyFlag: React.FC<CurrencyFlagProps> = ({
  countryCode,
  flagEmoji,
  className = '',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-3 text-xs',
    md: 'w-6 h-4.5 text-sm',
    lg: 'w-8 h-6 text-base',
    xl: 'w-10 h-7.5 text-xl',
  };

  const code = countryCode.toLowerCase();
  // If it's a special code (crypto, commodities, UN), use emoji
  const isSpecial = ['xx', 'un', 'bt', 'et', 'so'].includes(code) || code.length !== 2;

  if (imgError || isSpecial) {
    return (
      <span
        className={`inline-flex items-center justify-center select-none font-normal leading-none ${className}`}
        aria-label={flagEmoji}
      >
        {flagEmoji}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-[3px] shadow-xs border border-black/10 shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        src={`https://flagcdn.com/w80/${code}.png`}
        alt={flagEmoji}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </span>
  );
};
