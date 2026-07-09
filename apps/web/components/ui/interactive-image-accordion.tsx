"use client";

import React, { useState } from 'react';

export interface AccordionItemData {
  id: number;
  title: string;
  imageUrl: string;
}

const defaultItems: AccordionItemData[] = [
  {
    id: 1,
    title: 'Ladakh',
    imageUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 2,
    title: 'Spiti Valley',
    imageUrl: 'https://images.unsplash.com/photo-1735909987808-bf53a9281961?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 3,
    title: 'Goa',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1664353833316-81767b3234d6?q=80&w=646&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 4,
    title: 'Rajasthan',
    imageUrl: 'https://images.unsplash.com/photo-1598190896090-9dc5c70361d8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 5,
    title: 'Kerala',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1697730334419-fba83fe143b7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

interface AccordionItemProps {
  item: AccordionItemData;
  isActive: boolean;
  onMouseEnter: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isActive, onMouseEnter }) => {
  return (
    <div
      className={`
        relative h-[450px] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-in-out
        ${isActive ? 'w-[400px]' : 'w-[60px]'}
      `}
      onMouseEnter={onMouseEnter}
    >
      {/* Background Image */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://placehold.co/400x450/2d3748/ffffff?text=Image+Error';
        }}
      />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Caption Text */}
      <span
        className={`
          absolute text-white text-lg font-semibold whitespace-nowrap
          transition-all duration-300 ease-in-out
          ${isActive
            ? 'bottom-6 left-1/2 -translate-x-1/2 rotate-0' // Active state: horizontal, bottom-center
            // Inactive state: vertical, positioned at the bottom, for all screen sizes
            : 'w-auto text-left bottom-24 left-1/2 -translate-x-1/2 -rotate-90'
          }
        `}
      >
        {item.title}
      </span>
    </div>
  );
};

interface LandingAccordionItemProps {
  items?: AccordionItemData[];
}

export function LandingAccordionItem({ items = defaultItems }: LandingAccordionItemProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemHover = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-4 overflow-x-auto p-4 w-full h-full">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isActive={index === activeIndex}
          onMouseEnter={() => handleItemHover(index)}
        />
      ))}
    </div>
  );
}
