import React from 'react';

interface AmetaLogoProps {
  collapsed?: boolean;
  className?: string;
}

export const AmetaLogo: React.FC<AmetaLogoProps> = ({
  collapsed = false,
  className = '',
}) => {
  if (collapsed) {
    return (
      <svg
        viewBox="0 0 46 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-8 w-8 shrink-0 ${className}`}
        aria-label="Ameta Serviços"
      >
        {/* Left diamond (Royal Blue) */}
        <rect
          x="17"
          y="7"
          width="17"
          height="17"
          rx="3.5"
          transform="rotate(45 17 7)"
          className="stroke-[#243b94] dark:stroke-[#557aff]"
          strokeWidth="3.8"
        />
        {/* Right diamond (Teal) */}
        <rect
          x="29"
          y="7"
          width="17"
          height="17"
          rx="3.5"
          transform="rotate(45 29 7)"
          className="stroke-[#118681] dark:stroke-[#23bfb8]"
          strokeWidth="3.8"
        />
        {/* Interlock over-segment: Blue passes over Teal at bottom crossing */}
        <path
          d="M25.5 23.5 L21.2 27.8"
          className="stroke-[#243b94] dark:stroke-[#557aff]"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 186 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-11 w-auto max-w-full shrink-0 ${className}`}
      aria-label="Ameta Serviços"
    >
      {/* Left diamond (Royal Blue) */}
      <rect
        x="19"
        y="9"
        width="18.5"
        height="18.5"
        rx="3.8"
        transform="rotate(45 19 9)"
        className="stroke-[#243b94] dark:stroke-[#557aff]"
        strokeWidth="4"
      />
      {/* Right diamond (Teal) */}
      <rect
        x="33"
        y="9"
        width="18.5"
        height="18.5"
        rx="3.8"
        transform="rotate(45 33 9)"
        className="stroke-[#118681] dark:stroke-[#23bfb8]"
        strokeWidth="4"
      />
      {/* Interlock over-segment */}
      <path
        d="M28.5 25.5 L23.5 30.5"
        className="stroke-[#243b94] dark:stroke-[#557aff]"
        strokeWidth="4.2"
        strokeLinecap="round"
      />

      {/* Brand Wordmark */}
      <text
        x="55"
        y="24"
        className="fill-[#21358a] dark:fill-[#eef4ff]"
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: '21px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        Ameta
      </text>
      <text
        x="56"
        y="36.5"
        className="fill-[#118681] dark:fill-[#26bfb8]"
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: '8.8px',
          fontWeight: 700,
          letterSpacing: '0.24em',
        }}
      >
        SERVIÇOS
      </text>
    </svg>
  );
};
