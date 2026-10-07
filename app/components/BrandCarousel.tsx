"use client";

import React, { useState, useEffect } from 'react';
import { SmartImage } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Brand {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  href?: string;
  status?: string;
}

interface BrandCarouselProps {
  brands: Brand[];
}

export default function BrandCarousel({ brands }: BrandCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // 🔥 NEW: Track first load

  // Filter out "soon" brands for carousel
  const activeBrands = brands.filter(brand => brand.status?.toLowerCase() !== "soon");

  useEffect(() => {
    if (activeBrands.length === 0) return;

    // 🔥 Remove first load flag after component mounts
    const firstLoadTimer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 100);

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeBrands.length);
        setIsAnimating(false);
      }, 300);
    }, 4000); // Change every 4 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(firstLoadTimer);
    };
  }, [activeBrands.length]);

  if (activeBrands.length === 0) return null;

  const currentBrand = activeBrands[currentIndex];

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Animated Background Glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-transparent blur-3xl"
      />

      {/* Main Card Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={isFirstLoad ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateY: 20 }}
          transition={isFirstLoad ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
          className={`relative w-[420px] h-[480px] rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl ${
            isAnimating ? 'blur-sm scale-95' : 'blur-0 scale-100'
          } transition-all duration-300`}
        >
          {/* Brand Image Background */}
          <div className="absolute inset-0">
            <SmartImage
              src={currentBrand.image}
              alt={currentBrand.title}
              className="w-full h-full object-cover brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative h-full p-8 flex flex-col justify-between">
            {/* Top Badge */}
            <div className="flex justify-between items-start">
              <motion.span
                initial={isFirstLoad ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={isFirstLoad ? { duration: 0 } : { delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
              >
                {currentBrand.category}
              </motion.span>
              
            </div>

            {/* Bottom Content */}
            <div className="space-y-4">
              {/* Brand Logo/Name */}
              <motion.div
                initial={isFirstLoad ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={isFirstLoad ? { duration: 0 } : { delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                    {currentBrand.title}
                  </h3>
                
                </div>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={isFirstLoad ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={isFirstLoad ? { duration: 0 } : { delay: 0.5 }}
                className="text-white/80 text-sm leading-relaxed font-medium line-clamp-3"
              >
                {currentBrand.description}
              </motion.p>

              {/* Call to Action */}
              <motion.div
                initial={isFirstLoad ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={isFirstLoad ? { duration: 0 } : { delay: 0.6 }}
                className="flex items-center gap-3 pt-2"
              >
                <div className="h-[2px] w-8 bg-[#d11a2a]" />
                <Link 
                  href={currentBrand.href || "#"}
                  className="text-[10px] font-black uppercase tracking-widest text-white hover:text-[#d11a2a] transition-colors"
                >
                  Explore Products →
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d11a2a]/20 to-transparent blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-red-900/20 to-transparent blur-2xl" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
        {activeBrands.map((brand, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentIndex(idx);
                setIsAnimating(false);
              }, 300);
            }}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex 
                ? 'w-8 h-2 bg-[#d11a2a]' 
                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to ${brand.title}`}
          />
        ))}
      </div>

      {/* Brand Counter */}
      <motion.div
        initial={isFirstLoad ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isFirstLoad ? { duration: 0 } : { delay: 0.7 }}
        className="absolute -bottom-24 right-0 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
          {currentIndex + 1} of {activeBrands.length} Brands
        </span>
      </motion.div>
    </div>
  );
}