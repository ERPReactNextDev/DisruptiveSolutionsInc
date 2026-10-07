"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  limit,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import Footer from "../../components/navigation/footer";
import {
  ArrowLeft,
  Plus,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Minus,
  Maximize2,
  Star,
  User,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import QuoteCartPanel from "../../components/QuoteCartPanel";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Navbar from "@/app/components/navigation/navbar";

interface Product {
  id: string;
  name: string;
  sku?: string;
  itemCode?: string;
  slug?: string;
  mainImage?: string;
  qrCodeImage?: string;
  qrProductImages?: string | string[];
  galleryImages?: string[];
  catalogs?: string[];
  rating?: number;
  reviewCount?: number;
  brands?: string[];
  shortDescription?: string;
  technicalSpecs?: any[];
}

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");

  const logActivity = async (action: string, metadata: any = {}) => {
    try {
      await addDoc(collection(db, "cmsactivity_logs"), {
        action,
        page: "Product Details Page",
        timestamp: serverTimestamp(),
        userEmail: auth.currentUser?.email || "Guest Visitor",
        ...metadata,
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return "Anonymous";
    const [user, domain] = email.split("@");
    return `${user.charAt(0)}*****@${domain}`;
  };

  const checkCartStatus = useCallback(() => {
    const urlSlug = params?.slug as string;
    const savedCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    setIsInCart(savedCart.some((item: any) => item.id === urlSlug || item.slug === urlSlug));
  }, [params?.slug]);

  useEffect(() => {
    checkCartStatus();
    window.addEventListener("cartUpdated", checkCartStatus);
    return () => window.removeEventListener("cartUpdated", checkCartStatus);
  }, [checkCartStatus]);

  useEffect(() => {
    const fetchData = async () => {
      const urlSlug = params?.slug as string;
      if (!urlSlug) return;

      setLoading(true);
      try {
        let foundProduct: any = null;

        // 1. Try slug field first
        const qSlug = query(
          collection(db, "products"),
          where("slug", "==", urlSlug),
          limit(1),
        );
        const slugSnap = await getDocs(qSlug);

        if (!slugSnap.empty) {
          const d = slugSnap.docs[0];
          foundProduct = { id: d.id, ...d.data() };
        } else {
          // Fallback: try document ID
          const docRef = doc(db, "products", urlSlug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundProduct = { id: docSnap.id, ...docSnap.data() };
          }
        }

        if (foundProduct) {
          setProduct(foundProduct);
          // FIX: only set activeImage if mainImage is a non-empty string
          setActiveImage(foundProduct.mainImage || "");

          await logActivity(`Viewed Product: ${foundProduct.name}`, {
            productId: foundProduct.id,
            sku: foundProduct.sku || foundProduct.itemCode || "N/A",
          });

          // Fetch reviews
          const reviewsQuery = query(
            collection(db, "product_reviews"),
            where("productName", "==", foundProduct.name),
            where("status", "==", "shown"),
            limit(10),
          );
          const reviewsSnap = await getDocs(reviewsQuery);
          setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

          // Fetch related products
          const qRelated = query(collection(db, "products"), limit(13));
          const relatedSnap = await getDocs(qRelated);
          const filtered = relatedSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.id !== foundProduct.id)
            .slice(0, 12);
          setRelatedProducts(filtered.sort(() => 0.5 - Math.random()));
        } else {
          console.error("No product found for slug/id:", urlSlug);
          setProduct(null);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.slug]);

  const addToQuote = (prod: any) => {
    const currentCart = JSON.parse(localStorage.getItem("disruptive_quote_cart") || "[]");
    const existingIndex = currentCart.findIndex((item: any) => item.id === prod.id);
    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...currentCart];
      updatedCart[existingIndex].quantity = (updatedCart[existingIndex].quantity || 1) + selectedQty;
    } else {
      updatedCart = [...currentCart, { ...prod, quantity: selectedQty }];
    }
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    logActivity(`Added to Quote: ${prod.name}`, { productId: prod.id, quantity: selectedQty });
    setSelectedQty(1);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d11a2a]" />
      </div>
    );
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center text-xs font-black uppercase tracking-widest">
        Product Not Found
      </div>
    );

  // Build thumbnail list — filter out falsy values to avoid empty src
  const allThumbnails = [product.mainImage, ...(product.galleryImages || [])].filter(
    (img): img is string => Boolean(img),
  );

  // QR images — support both string and array
  const qrImages: string[] = Array.isArray(product.qrProductImages)
    ? product.qrProductImages.filter(Boolean)
    : product.qrProductImages
      ? [product.qrProductImages]
      : product.qrCodeImage
        ? [product.qrCodeImage]
        : [];

  return (
    <>
      <QuoteCartPanel />

      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {isFullscreen && activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <button className="absolute top-8 right-8 p-3 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={activeImage}
              alt={product.name}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-white pb-12 relative font-sans selection:bg-[#d11a2a] selection:text-white overflow-x-hidden">
        {/* HERO */}
        <div className="relative h-[400px] md:h-[550px] w-full overflow-hidden bg-[#050505]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 hover:scale-100"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1513506494266-1030d30230f6?q=80&w=2000&auto=format&fit=crop')`,
              filter: "brightness(0.85)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[#050505]" />
          </div>

          <div className="relative z-50">
            <Navbar />
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-black text-[10px] font-black uppercase tracking-[0.4em] bg-yellow-400 px-3 py-1.5 rounded-sm shadow-xl shadow-yellow-400/10">
                    {product?.brands?.[0] || "LIT"}
                  </span>
                  <div className="h-[2px] w-8 bg-yellow-400/50" />
                </div>
                <h1 className="text-white text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl">
                  {product?.name || "Premium Lighting"}
                </h1>
                <div className="max-w-2xl border-l-2 border-yellow-400 pl-6">
                  <p className="text-slate-300 text-sm md:text-lg font-medium leading-relaxed drop-shadow-md">
                    {product?.shortDescription ||
                      "Experience the warmth of innovation. LIT brings superior illumination and energy efficiency to every architectural project."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 md:px-6 mt-8 md:mt-12">
          {/* BREADCRUMBS */}
          <nav className="flex items-center gap-2 mb-6 text-[9px] font-black uppercase tracking-widest text-gray-400">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link href="/brand-lit" className="hover:text-black transition-colors">Products</Link>
            <ChevronRight size={10} />
            <span className="text-[#d11a2a] italic">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* LEFT: GALLERY */}
            <div className="lg:col-span-5 space-y-4 md:sticky md:top-24">
              <div
                onClick={() => {
                  if (activeImage) {
                    setIsFullscreen(true);
                    logActivity(`Full-screen image opened: ${product.name}`);
                  }
                }}
                className="bg-white rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden group cursor-none relative aspect-square"
                onMouseMove={(e) => {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - left) / width) * 100;
                  const y = ((e.clientY - top) / height) * 100;
                  const target = e.currentTarget.querySelector(".zoom-image") as HTMLElement;
                  if (target) target.style.transformOrigin = `${x}% ${y}%`;
                  const cursor = e.currentTarget.querySelector(".custom-cursor") as HTMLElement;
                  if (cursor) {
                    cursor.style.left = `${e.clientX - left}px`;
                    cursor.style.top = `${e.clientY - top}px`;
                  }
                }}
              >
                {(product.reviewCount || 0) > 0 && (
                  <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-gray-100 shadow-xl flex flex-col items-center">
                    <span className="text-[14px] font-black italic leading-none">{product.rating}</span>
                    <Star size={8} className="fill-yellow-500 text-yellow-500 mt-1" />
                  </div>
                )}

                <div className="custom-cursor absolute pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/40 shadow-2xl flex items-center justify-center">
                    <Maximize2 size={20} className="text-black" strokeWidth={3} />
                  </div>
                </div>

                <motion.div
                  className="zoom-image w-full h-full p-6 md:p-10 flex items-center justify-center transition-transform duration-200 ease-out"
                  whileHover={{ scale: 2.5 }}
                >
                  <AnimatePresence mode="wait">
                    {activeImage ? (
                      <motion.img
                        key={activeImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={activeImage}
                        className="max-h-[250px] md:max-h-[400px] w-full object-contain pointer-events-none"
                        alt={product.name}
                      />
                    ) : (
                      <div className="text-gray-200 text-xs font-bold uppercase tracking-widest">
                        No Image
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* THUMBNAILS */}
              {allThumbnails.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allThumbnails.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden bg-gray-50 ${
                        activeImage === img
                          ? "border-[#d11a2a] scale-95 shadow-lg"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SmartImage src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: DETAILS */}
            <div className="lg:col-span-7 space-y-8 md:space-y-10">
              <div>
                <div className="flex gap-2 mb-3">
                  {product.brands?.map((brand: string) => (
                    <span
                      key={brand}
                      className="px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest rounded"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight mb-2 text-gray-900 italic">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.floor(product.rating || 0)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a]">
                    {(product.reviewCount || 0) > 0
                      ? `${product.rating} | ${product.reviewCount} Reviews`
                      : "No reviews yet"}
                  </span>
                </div>

                {product.shortDescription && (
                  <p className="text-sm md:text-base font-medium text-gray-500 leading-relaxed mb-6 max-w-xl">
                    {product.shortDescription}
                  </p>
                )}
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                  SKU: {product.sku || product.itemCode || "N/A"}
                </p>
              </div>

              {/* TECHNICAL SPECS */}
              <div className="space-y-6">
                {product.technicalSpecs?.map((specGroup: any, groupIdx: number) => {
                  // Support both CMS format (specs[]) and legacy format (rows[])
                  const rows = specGroup.specs || specGroup.rows || [];
                  if (rows.length === 0) return null;
                  return (
                    <div key={specGroup.id || groupIdx} className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a]">
                        {specGroup.label || specGroup.specGroup || "Specifications"}
                      </h3>
                      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse bg-white text-left">
                          <tbody>
                            {rows.map((row: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="w-2/5 p-3 md:p-3.5 bg-gray-50/30 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase border-r border-gray-50 italic">
                                  {row.name}
                                </td>
                                <td className="p-3 md:p-3.5 text-[10px] md:text-[12px] font-semibold text-gray-700 uppercase">
                                  {row.value || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-4 pt-8 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2 bg-gray-50">
                    <button
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="p-1 hover:text-[#d11a2a] transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-black">{selectedQty}</span>
                    <button
                      onClick={() => setSelectedQty(selectedQty + 1)}
                      className="p-1 hover:text-[#d11a2a] transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => addToQuote(product)}
                    className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                      isInCart
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-[#d11a2a] text-white hover:bg-black"
                    }`}
                  >
                    {isInCart ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add to Quote
                      </>
                    )}
                  </button>
                </div>

                {/* CATALOG DOWNLOAD BUTTONS */}
                {(product.catalogs?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-1 gap-3 pt-4">
                    {product.catalogs!.map((url, i) => {
                      const forceDownloadUrl = url
                        .replace("/private/", "/upload/")
                        .replace("/upload/", "/upload/fl_attachment/");
                      const fileName = `Datasheet_${product.name.replace(/\s+/g, "_")}_${i + 1}.pdf`;
                      return (
                        <a
                          key={i}
                          href={forceDownloadUrl}
                          download={fileName}
                          target="_self"
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] transition-all shadow-lg group border-none no-underline cursor-pointer"
                        >
                          <FileText
                            size={16}
                            className="group-hover:scale-110 transition-transform text-white"
                          />
                          <span className="text-white">Download PDF Datasheet {i + 1}</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* QR CODE IMAGES */}
                {qrImages.length > 0 && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    {qrImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-32 h-32 border border-slate-200 rounded-xl overflow-hidden bg-white p-2 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <SmartImage
                          src={img}
                          className="w-full h-full object-contain"
                          alt={`QR Code ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <section className="mt-24 pt-24 border-t border-gray-100">
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d11a2a] mb-2">
                    Verified Feedbacks
                  </h3>
                  <h2 className="text-3xl font-black uppercase italic">Reviews</h2>
                </div>
                <div className="p-8 bg-gray-50 rounded-[32px] space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black italic leading-none">
                      {product.rating || "0.0"}
                    </span>
                    <span className="text-sm font-bold text-gray-400 uppercase pb-1">/ 5.0</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={
                          i < Math.floor(product.rating || 0)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Based on {product.reviewCount || 0} customer reviews
                  </p>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      key={rev.id}
                      className="pb-8 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white border-2 border-gray-100 shadow-sm">
                            <User size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[11px] font-black uppercase tracking-tight">
                                {rev.customerName || "Anonymous"}
                              </h4>
                              <span className="text-[8px] bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-400 uppercase tracking-tighter">
                                Verified Buyer
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-[#d11a2a] lowercase mb-1">
                              {rev.customerEmail
                                ? maskEmail(rev.customerEmail)
                                : "no-email@provided.com"}
                            </p>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                              {rev.createdAt
                                ?.toDate()
                                .toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 bg-gray-50 px-3 py-1.5 rounded-full">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={
                                i < rev.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pl-16">
                        <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed italic relative">
                          <span className="text-3xl text-gray-100 absolute -left-8 -top-2 font-serif">
                            &ldquo;
                          </span>
                          {rev.comment}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[32px] text-gray-300">
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      No reviews for this product yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 mb-12">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d11a2a] mb-2">
                    You might also need
                  </h3>
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic leading-none">
                    Related Gear
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button className="swiper-prev-btn p-3 border border-gray-100 rounded-full hover:bg-black hover:text-white transition-all shadow-sm">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="swiper-next-btn p-3 border border-gray-100 rounded-full hover:bg-black hover:text-white transition-all shadow-sm">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.2}
                navigation={{ prevEl: ".swiper-prev-btn", nextEl: ".swiper-next-btn" }}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                breakpoints={{ 640: { slidesPerView: 2.2 }, 1024: { slidesPerView: 4 } }}
                className="pb-12"
              >
                {relatedProducts.map((item) => (
                  <SwiperSlide key={item.id}>
                    <Link
                      href={`/brand-lit/${item.slug || item.id}`}
                      onClick={() =>
                        logActivity(`Clicked Related Product: ${item.name}`, {
                          fromProductId: product.id,
                        })
                      }
                      className="group block h-full"
                    >
                      <div className="bg-gray-50 rounded-[24px] p-6 border border-transparent group-hover:border-gray-200 group-hover:bg-white transition-all duration-300 h-full flex flex-col">
                        <div className="aspect-square mb-6 overflow-hidden flex items-center justify-center bg-white rounded-2xl p-4 shadow-sm relative">
                          {/* FIX: fallback for related product images */}
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            src={item.mainImage || "/placeholder.svg"}
                            alt={item.name || "Product"}
                            className="max-h-full object-contain"
                          />
                          {(item.reviewCount || 0) > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/90 px-1.5 py-0.5 rounded text-[7px] text-white">
                              <Star size={6} className="fill-yellow-500 text-yellow-500" />
                              <span>{item.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-1 mb-2">
                            {item.brands?.slice(0, 1).map((b: string) => (
                              <span
                                key={b}
                                className="text-[7px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          <h4 className="text-[11px] font-black uppercase leading-tight group-hover:text-[#d11a2a] transition-colors line-clamp-2 italic">
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 tracking-widest">
                            SKU: {item.sku || item.itemCode || "N/A"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}