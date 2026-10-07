"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ShoppingBag, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form States
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
      setCartItems(JSON.parse(savedCart));
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
    
    // Generate a simple Inquiry ID
    const inquiryId = `DS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    try {
      // 1. I-save sa Firebase 'inquiries' collection
      await addDoc(collection(db, "inquiries"), {
        inquiryId: inquiryId,
        customerDetails: formData,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity || 1,
          image: item.mainImage
        })),
        status: "pending",
        type: "quotation", // <--- HETO YUNG DAGDAG PARA SA DATABASE
        createdAt: serverTimestamp(),
      });

      // 2. I-send ang Email gamit ang iyong API Route
      const emailRes = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerDetails: formData,
          items: cartItems.map(item => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity || 1,
            image: item.mainImage 
          })),
          inquiryId: inquiryId,
          type: "quotation", // <--- DAGDAG DIN DITO PARA SA API LOGIC
        }),
      });

      if (!emailRes.ok) {
        console.error("Email failed but database record was created.");
      }

      // 3. Success Actions
      localStorage.removeItem("disruptive_quote_cart");
      window.dispatchEvent(new Event("cartUpdated"));
      setIsSuccess(true);
      
      // Redirect pagkatapos ng 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);

    } catch (error) {
      console.error("Submission Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Inquiry Sent!</h2>
        <p className="text-gray-400 text-sm mt-2 font-medium">Thank you. We will get back to you shortly via email.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-[#d11a2a] selection:text-white">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#d11a2a] transition-colors">
            <ChevronLeft size={16} /> Back to Gallery
          </Link>
          <h1 className="text-xl font-black uppercase italic text-[#d11a2a]">Product Request</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* LEFT SIDE: CUSTOMER DETAILS */}
          <div className="lg:col-span-7 space-y-10">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest mb-8 border-b pb-4">Customer Details</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First name *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last name *</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Street address *</label>
                  <input required name="streetAddress" placeholder="House number and street name" value={formData.streetAddress} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                  <input name="apartment" placeholder="Apartment, suite, unit, etc. (optional)" value={formData.apartment} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone (optional)</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium" />
                </div>

                <div className="space-y-2 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Order notes (optional)</label>
                  <textarea name="orderNotes" value={formData.orderNotes} onChange={handleInputChange} placeholder="Notes about your order, e.g. special notes for delivery." className="w-full bg-white border border-gray-200 rounded-xl p-4 min-h-[120px] focus:border-[#d11a2a] outline-none transition-colors text-sm font-medium resize-none" />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDE: ORDER SUMMARY (Following your image) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm sticky top-32">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b pb-4">Your Request</h3>
              
              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden p-2 flex-shrink-0 border border-gray-50">
                      <SmartImage src={item.mainImage} className="w-full h-full object-contain" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase leading-tight truncate">
                        {item.name} <span className="text-[#d11a2a] ml-1">× {item.quantity || 1}</span>
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{item.sku}</p>
                    </div>
                  </div>
                ))}

                {cartItems.length === 0 && (
                  <div className="text-center py-10">
                    <ShoppingBag className="mx-auto text-gray-200 mb-2" size={32} />
                    <p className="text-[10px] font-black uppercase text-gray-400">List is empty</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <p className="text-[9px] text-gray-400 leading-relaxed italic">
                  Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our <span className="text-black font-bold underline cursor-pointer">privacy policy</span>.
                </p>
                
                <button 
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
                >
                  {isSubmitting ? <><Loader2 className="animate-spin" size={16}/> Sending...</> : "Submit Inquiry"}
                </button>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}