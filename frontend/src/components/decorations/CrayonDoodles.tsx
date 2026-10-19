import React from 'react';

export function StarDoodle({ className = 'w-6 h-6 text-[#FFC93C]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.8 8.6L22 9.3L16.6 14.1L18.2 21.2L12 17.5L5.8 21.2L7.4 14.1L2 9.3L9.2 8.6L12 2Z" />
    </svg>
  );
}

export function CloudDoodle({ className = 'w-10 h-6 text-[#5BC0EB]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20C6 20 3 17 3 13C3 9.5 5.5 6.5 9 6.1C10.5 2.5 14.5 0 19 0C24.5 0 29 4 29.8 9.5C33.5 10 36.5 13 36.5 17C36.5 21 33 24 29 24H10C6 24 3 21 3 20" />
    </svg>
  );
}

export function CrayonStrokeDivider({ color = '#FF6B6B' }: { color?: string }) {
  return (
    <div className="w-full flex justify-center my-6 overflow-hidden select-none opacity-80">
      <svg width="220" height="12" viewBox="0 0 220 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 7C35 4 80 9 120 5C160 1 190 8 218 6"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
