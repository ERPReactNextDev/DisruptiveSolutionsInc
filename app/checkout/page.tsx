"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "", 
    streetAddress: "",
    apartment: "", 
    phone: "", 
    email: "", 
    orderNotes: "",
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("disruptive_quote_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart", error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert("Your cart is empty");

    setIsSubmitting(true);
    try {
      // Strip undefined values — Firestore rejects them
      const sanitizedItems = cartItems.map(item => ({
        name: item.name || item.title || "",
        sku: item.itemCode || item.sku || "",
        quantity: item.quantity || 1,
        image: item.mainImage || item.imageUrl || item.images?.[0]?.src || "",
      }));

      // 1. SAVE TO FIREBASE
      const docRef = await addDoc(collection(db, "inquiries"), {
        type: "product",
        customerDetails: formData,
        items: sanitizedItems,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 2. SEND EMAIL
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerDetails: formData,
            items: sanitizedItems,
            inquiryId: docRef.id
          }),
        });
      } catch (emailError) {
        console.error("Email notification failed, but database record was created.");
      }

      // 3. CLEANUP
      localStorage.removeItem("disruptive_quote_cart");
      window.dispatchEvent(new Event("cartUpdated"));
      setIsSuccess(true);
      setTimeout(() => router.push("/"), 3000);

    } catch (error) {
      console.error("Submission Error:", error);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-50 p-6 rounded-full mb-6">
          <CheckCircle2 size={60} className="text-green-500" />
        </motion.div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Inquiry Sent!</h2>
        <p className="text-gray-400 text-sm mt-2 font-medium uppercase tracking-widest">We will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans selection:bg-[#d11a2a] selection:text-white">
      <nav className="p-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#d11a2a] transition-colors">
            <ChevronLeft size={16}/> Back
          </button>
          <h1 className="text-xl font-black uppercase tracking-tighter italic text-[#d11a2a]">Product Request</h1>
          <div className="w-10" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-16">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 border-b pb-4">Customer Details</h2>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First name *</label>
                    <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last name *</label>
                    <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email address *</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Number *</label>
                        <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold" />
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street address *</label>
                  <input required name="streetAddress" placeholder="House number and street name" value={formData.streetAddress} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold" />
                  <input name="apartment" placeholder="Apartment, suite, unit, etc. (optional)" value={formData.apartment} onChange={handleInputChange} className="w-full border-b border-gray-200 py-2 focus:border-[#d11a2a] outline-none text-sm font-bold mt-2" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order notes (optional)</label>
                  <textarea name="orderNotes" value={formData.orderNotes} onChange={handleInputChange} className="w-full border border-gray-100 rounded-2xl p-4 min-h-[120px] focus:border-[#d11a2a] outline-none text-sm font-medium bg-gray-50/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="sticky top-32 space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b pb-4">Your Selection</h2>
              <div className="divide-y divide-gray-100 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-6 flex gap-6 items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 flex-shrink-0 border border-gray-50">
                      <SmartImage src={item.mainImage} className="w-full h-full object-contain" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[12px] font-black uppercase italic text-gray-900">
                        {item.name} <span className="text-[#d11a2a] ml-2 not-italic">× {item.quantity || 1}</span>
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">SKU: {item.itemCode || item.sku || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#d11a2a] transition-all flex items-center justify-center gap-3 disabled:bg-gray-200"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : "Submit Request"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}