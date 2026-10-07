"use client";

import React, { useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, CheckCircle2, MessageSquare, Send, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, arrayUnion } from "firebase/firestore";

interface QuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    inquiry: any;
    userData: any;
    email: string;
    onUpdate: (id: string, newStatus: string) => void;
}

export default function QuotationModal({ isOpen, onClose, inquiry, userData, email, onUpdate }: QuotationModalProps) {
    const [ratings, setRatings] = useState<{ [key: number]: number }>({});
    const [comments, setComments] = useState<{ [key: number]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!inquiry) return null;

    const reviewedItems = inquiry.reviewedItems || [];
    const status = inquiry.status?.toLowerCase() || "pending";
    const totalItems = inquiry.items?.length || 0;
    const isFullyReviewed = reviewedItems.length === totalItems;

    const handleSubmitAll = async () => {
        // Find indices that haven't been reviewed yet
        const pendingIndices = inquiry.items
            .map((_: any, index: number) => index)
            .filter((index: number) => !reviewedItems.includes(index));

        // Validation: Check if all pending items have comments
        const incomplete = pendingIndices.some((index: number) => !comments[index]?.trim());

        if (incomplete) {
            alert("Please provide feedback for all items before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const docRef = doc(db, "inquiries", inquiry.id);

            for (const index of pendingIndices) {
                const item = inquiry.items[index];
                
                // 1. Save to product_reviews collection
                await addDoc(collection(db, "product_reviews"), {
                    productId: item.id || "N/A",
                    productName: item.name,
                    productImage: item.image,
                    customerName: userData?.fullName || "Anonymous",
                    customerEmail: email,
                    rating: ratings[index] || 5,
                    comment: comments[index],
                    createdAt: new Date(),
                    inquiryRef: inquiry.id
                });

                // 2. Track reviewed index in the inquiry document
                await updateDoc(docRef, {
                    reviewedItems: arrayUnion(index)
                });
            }

            // 3. Finalize status if all items are done
            await updateDoc(docRef, { status: "reviewed" });
            onUpdate(inquiry.id, "reviewed");
            
            alert("Thank you! Your feedback for all items has been recorded.");
            onClose();
        } catch (error: any) {
            console.error("Submission Error:", error);
            alert("Error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Product <span className="text-[#d11a2a]">Feedback</span></h3>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1 text-zinc-500">REF: #{inquiry.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-[#d11a2a] rounded-full transition-all text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* ITEMS LIST */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {inquiry.items?.map((item: any, i: number) => {
                                const isAlreadyReviewed = reviewedItems.includes(i);

                                return (
                                    <div key={i} className={`p-6 rounded-[32px] border transition-all ${
                                        isAlreadyReviewed ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.03] border-white/5"
                                    }`}>
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Left: Product Info */}
                                            <div className="w-full md:w-32 flex-shrink-0 text-center md:text-left">
                                                <div className="aspect-square bg-white rounded-2xl p-2 relative overflow-hidden shadow-xl mx-auto md:mx-0">
                                                    <SmartImage src={item.image} className="object-contain w-full h-full" alt={item.name} />
                                                    {isAlreadyReviewed && (
                                                        <div className="absolute inset-0 bg-green-600/90 backdrop-blur-sm flex items-center justify-center">
                                                            <CheckCircle2 size={30} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h5 className="text-[10px] font-black uppercase text-white mt-3 line-clamp-1">{item.name}</h5>
                                                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Quantity: {item.quantity}</p>
                                            </div>

                                            {/* Right: Review Form */}
                                            <div className="flex-1">
                                                {isAlreadyReviewed ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-green-500 bg-black/20 rounded-2xl py-6">
                                                        <CheckCircle2 size={20} className="mb-2" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Feedback Submitted</span>
                                                    </div>
                                                ) : status === "finished" ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Rate Item</span>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button key={star} onClick={() => setRatings({...ratings, [i]: star})}>
                                                                        <Star size={16} className={`${star <= (ratings[i] || 5) ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"} transition-all`} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <textarea 
                                                            value={comments[i] || ""} 
                                                            onChange={(e) => setComments({...comments, [i]: e.target.value})}
                                                            placeholder="What did you think about this product?"
                                                            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs font-medium outline-none focus:border-[#d11a2a]/50 text-white h-24 resize-none transition-all"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-zinc-600 uppercase italic">Review opens when order is finished</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SUBMIT ALL FOOTER */}
                        {status === "finished" && !isFullyReviewed && (
                            <div className="p-8 bg-white/[0.02] border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                                <button 
                                    onClick={handleSubmitAll}
                                    disabled={isSubmitting}
                                    className="w-full bg-[#d11a2a] hover:bg-white hover:text-black py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Submitting All...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit All Reviews
                                        </>
                                    )}
                                </button>
                                <p className="text-[9px] text-center text-zinc-500 mt-4 font-bold uppercase tracking-widest">
                                    Clicking this will submit feedback for all pending items
                                </p>
                            </div>
                        )}
                        
                        {isFullyReviewed && (
                            <div className="p-8 text-center bg-green-500/10 border-t border-green-500/20">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">You have reviewed all items in this order. Thank you!</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}