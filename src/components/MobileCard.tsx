'use client';

import { useState } from 'react';

interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  touchFeedback?: boolean;
}

export default function MobileCard({
  children,
  onClick,
  className = '',
  style = {},
  touchFeedback = true
}: MobileCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (touchFeedback) setIsPressed(true);
  };

  const handleTouchEnd = () => {
    if (touchFeedback) setIsPressed(false);
  };

  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '16px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...style,
  };

  if (onClick) {
    return (
      <div
        className={className}
        style={baseStyle}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={baseStyle}>
      {children}
    </div>
  );
}