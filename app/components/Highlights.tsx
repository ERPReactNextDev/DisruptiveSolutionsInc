"use client";

import React, { useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Plus, ChevronRight, Star } from "lucide-react";

interface HighlightsProps {
    products: any[];
    addToQuote: (product: any) => void;
    quoteCart: any[];
}

export default function Highlights({ products, addToQuote, quoteCart }: HighlightsProps) {
    // Kunin ang Top 5 products
    const topProducts = products.slice(0, 5);

    // Track which card has its specs overlay expanded via click
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (topProducts.length === 0) {
        return (
            <div className="py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-gray-300">
                No products found to highlight.
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] flex-1 bg-gray-100"></div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#d11a2a] flex items-center gap-2">
                    <Star size={14} fill="#d11a2a" /> Most Popular Solutions
                </h2>
                <div className="h-[1px] flex-1 bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {topProducts.map((product, index) => {
                    const isInCart = quoteCart.some((item) => item.id === product.id);
                    const firstGroup = product.technicalSpecs?.[0];

                    // Ang unang product ay gagawing malaki (Feature Card)
                    const isLarge = index === 0;

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`${isLarge ? "md:col-span-8 md:row-span-2" : "md:col-span-4"
                                } group/card relative bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-700 flex flex-col`}
                        >
                            {/* Product Badge */}
                            <div className="absolute top-4 left-4 z-40">
                                <span className="bg-black text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    {isLarge ? "Featured Product" : `Top ${index + 1}`}
                                </span>
                            </div>

                            <Link href={`/lighting-products-smart-solutions/${product.id}`} className="flex-1">
                                <div className={`relative w-full ${isLarge ? "h-64 md:h-[450px]" : "h-48"} bg-[#f9f9f9] p-8 flex items-center justify-center overflow-hidden`}>
                                    <SmartImage
                                        src={product.mainImage}
                                        alt={product.name}
                                        className="max-w-[80%] max-h-[80%] object-contain group-hover/card:scale-110 group-hover/card:blur-[3px] transition-all duration-1000"
                                    />

                                    {/* Specs Overlay — visible on hover (desktop) or click/tap */}
                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setExpandedId(expandedId === product.id ? null : product.id);
                                        }}
                                        className={`absolute inset-0 bg-black/80 backdrop-blur-[4px] flex flex-col justify-center items-center p-6 transition-all duration-500 z-30 cursor-pointer ${
                                            expandedId === product.id
                                                ? "opacity-100 pointer-events-auto"
                                                : "opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto"
                                        }`}
                                    >
                                        <p className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest mb-4 italic">Quick Overview</p>
                                        <table className="w-full max-w-[250px]">
                                            <tbody className="divide-y divide-white/10">
                                                {(firstGroup?.specs || firstGroup?.rows)?.slice(0, 4).map((row: any, i: number) => (
                                                    <tr key={`spec-row-${i}`}>
                                                        <td className="py-2 text-[8px] font-bold text-gray-400 uppercase italic">
                                                            {row.name}
                                                        </td>
                                                        <td className="py-2 text-[9px] font-black text-white uppercase text-right">
                                                            {row.value || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-6 flex items-center gap-2 text-white text-[8px] font-black uppercase bg-[#d11a2a] px-5 py-2 rounded-full">
                                            View Details <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="p-6 md:p-8 bg-white border-t border-gray-50 flex flex-col gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">{product.sku}</p>
                                    <h4 className={`${isLarge ? "text-xl" : "text-sm"} font-black uppercase italic leading-tight text-gray-900 group-hover/card:text-[#d11a2a] transition-colors line-clamp-2`}>
                                        {product.name}
                                    </h4>
                                </div>

                                <button
                                    onClick={() => addToQuote(product)}
                                    className={`w-full py-4 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 transition-all ${isInCart
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-900 text-white hover:bg-[#d11a2a] shadow-lg shadow-black/5"
                                        }`}
                                >
                                    {isInCart ? <><Check size={14} strokeWidth={3} /> Added to Quote</> : <><Plus size={14} strokeWidth={3} /> Add to Quote List</>}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}