"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Navbar from "../components/navigation/navbar";
import Footer from "../components/navigation/footer";
import Highlights from "../components/Highlights";
import ProductFilter from "../components/zumtobelfilter";
import {
  Loader2,
  X,
  Plus,
  Trash2,
  Check,
  Minus,
  Star,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import FloatingChatWidget from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

// ── Helpers ────────────────────────────────────────────────────────────────
const toSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

interface FilterState {
  [key: string]: any;
}

const USAGE_GROUPS = ["INDOOR", "OUTDOOR", "SOLAR"] as const;
type UsageGroup = (typeof USAGE_GROUPS)[number];

const USAGE_GROUP_DESCRIPTIONS: Record<UsageGroup, string> = {
  INDOOR: "Interior lighting solutions for commercial and residential spaces",
  OUTDOOR: "Exterior luminaires built for harsh environments and public spaces",
  SOLAR:
    "Solar-powered lighting systems for off-grid and sustainable installations",
};

export default function BrandLitPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quoteCart, setQuoteCart] = useState<any[]>([]);

  // Accordion: only top-level usage group
  const [openUsageGroup, setOpenUsageGroup] = useState<UsageGroup | null>(null);

  // Applications tab
  const [applicationDocs, setApplicationDocs] = useState<any[]>([]);
  const [openApplicationId, setOpenApplicationId] = useState<string | null>(
    null,
  );

  const [activeView, setActiveView] = useState("CATEGORIES");
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch categories (productfamilies) ─────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "productfamilies"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDbCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch products ─────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // ── Fetch applications ─────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "applications"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplicationDocs(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsubscribe();
  }, []);

  // ── Sync cart ──────────────────────────────────────────────────────────
  const syncCart = useCallback(() => {
    const saved = localStorage.getItem("disruptive_quote_cart");
    setQuoteCart(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("cartUpdated", syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("cartUpdated", syncCart);
    };
  }, [syncCart]);

  // ── Filtered products ──────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesSKU =
          product.itemCode?.toLowerCase().includes(q) ||
          product.sku?.toLowerCase().includes(q);
        const matchesDesc = product.shortDescription?.toLowerCase().includes(q);
        const matchesSpecs = product.technicalSpecs?.some((sg: any) =>
          (sg.specs || sg.rows || []).some(
            (s: any) =>
              s.name?.toLowerCase().includes(q) ||
              s.value?.toLowerCase().includes(q),
          ),
        );
        const matchesDynamic = product.dynamicSpecs?.some(
          (s: any) =>
            s.title?.toLowerCase().includes(q) ||
            s.value?.toLowerCase().includes(q),
        );
        if (
          !matchesName &&
          !matchesSKU &&
          !matchesDesc &&
          !matchesSpecs &&
          !matchesDynamic
        )
          return false;
      }

      const activeEntries = Object.entries(filters).filter(
        ([k, v]) => v !== "*" && v !== "" && k !== "fluxFrom" && k !== "fluxTo",
      );
      for (const [key, val] of activeEntries) {
        let hit = product.dynamicSpecs?.some(
          (s: any) =>
            s.title?.toLowerCase() === key.toLowerCase() &&
            s.value?.toLowerCase() === val.toString().toLowerCase(),
        );
        if (!hit) {
          product.technicalSpecs?.forEach((sg: any) => {
            (sg.specs || sg.rows || []).forEach((s: any) => {
              if (
                s.name?.toLowerCase() === key.toLowerCase() &&
                s.value?.toLowerCase().includes(val.toString().toLowerCase())
              )
                hit = true;
            });
          });
        }
        if (!hit) return false;
      }
      return true;
    });
  }, [products, filters, searchQuery]);

  // ── Group categories by productUsage ──────────────────────────────────
  const groupedCategories = useMemo(() => {
    const groups: Record<UsageGroup, any[]> = {
      INDOOR: [],
      OUTDOOR: [],
      SOLAR: [],
    };
    dbCategories.forEach((cat) => {
      const usages: string[] = cat.productUsage || [];
      usages.forEach((u) => {
        const key = u.trim().toUpperCase() as UsageGroup;
        if (groups[key] && !groups[key].find((c) => c.id === cat.id))
          groups[key].push(cat);
      });
    });
    return groups;
  }, [dbCategories]);

  // ── Group by application ───────────────────────────────────────────────
  const groupedByApplication = useMemo(() => {
    const map: Record<string, { appDoc: any; families: any[] }> = {};
    applicationDocs.forEach((app) => {
      map[app.id] = { appDoc: app, families: [] };
    });
    dbCategories.forEach((cat) => {
      (cat.applications || []).forEach((appId: string) => {
        if (map[appId] && !map[appId].families.find((f) => f.id === cat.id))
          map[appId].families.push(cat);
      });
    });
    return Object.values(map).filter((e) => e.families.length > 0);
  }, [applicationDocs, dbCategories]);

  // ── Count products per family ──────────────────────────────────────────
  const countForFamily = useCallback(
    (family: any) => {
      const title = family.title?.trim().toUpperCase();
      return filteredProducts.filter(
        (p) =>
          p.productFamily?.trim().toUpperCase() === title ||
          p.dynamicSpecs?.some(
            (s: any) => s.value?.trim().toUpperCase() === title,
          ),
      ).length;
    },
    [filteredProducts],
  );

  // ── Cart actions ───────────────────────────────────────────────────────
  const addToQuote = (product: any) => {
    const currentCart = JSON.parse(
      localStorage.getItem("disruptive_quote_cart") || "[]",
    );
    if (!currentCart.find((i: any) => i.id === product.id)) {
      const updated = [...currentCart, { ...product, quantity: 1 }];
      localStorage.setItem("disruptive_quote_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("cartUpdated"));
      setIsCartOpen(true);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = quoteCart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
        : item,
    );
    setQuoteCart(updated);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updated));
  };

  const removeFromQuote = (id: string) => {
    const updated = quoteCart.filter((i: any) => i.id !== id);
    setQuoteCart(updated);
    localStorage.setItem("disruptive_quote_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // ── First product image per family ────────────────────────────────────
  const firstProductImageForFamily = useCallback(
    (family: any): string | null => {
      const title = family.title?.trim().toUpperCase();
      const match = products.find(
        (p) =>
          p.productFamily?.trim().toUpperCase() === title ||
          p.dynamicSpecs?.some(
            (s: any) => s.value?.trim().toUpperCase() === title,
          ),
      );
      if (!match) return null;
      // products store their primary image in mainImage (Cloudinary URL)
      return (
        match.mainImage ||
        match.images?.[0]?.src ||
        match.images?.[0] ||
        match.imageUrl ||
        null
      );
    },
    [products],
  );

  // ── Family Card (reusable) ─────────────────────────────────────────────
  const FamilyCard = ({ category }: { category: any }) => {
    const count = countForFamily(category);

    // Always hide families that have no products
    if (count === 0) return null;

    const slug = toSlug(category.title || "");
    const productImg = firstProductImageForFamily(category);
    // Use first product image if available, otherwise fall back to the family's own imageUrl
    const displayImage = productImg || category.imageUrl || null;

    return (
      <Link
        href={`/brand-lit/family/${slug}`}
        className="group flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border border-transparent hover:border-[#d11a2a] hover:bg-white hover:shadow-lg transition-all duration-200"
      >
        {/* Image */}
        <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 group-hover:bg-white transition-colors">
          {displayImage ? (
            <SmartImage
              src={displayImage}
              alt={category.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Star size={36} className="text-gray-200" />
          )}
        </div>

        {/* Title */}
        <p className="text-[9px] font-black uppercase italic text-center leading-tight text-gray-700 group-hover:text-[#d11a2a] transition-colors">
          {category.title}
        </p>

        {/* Count + Arrow */}
        <div className="flex items-center gap-1">
          {count > 0 && (
            <span className="text-[7px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 group-hover:bg-[#d11a2a] group-hover:text-white transition-colors">
              {count}
            </span>
          )}
          <ArrowRight
            size={10}
            className="text-gray-300 group-hover:text-[#d11a2a] group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a] selection:text-white overflow-x-hidden">
      <Navbar />
      <FloatingMenuWidget />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative h-[60vh] w-full flex items-center justify-center bg-black">
        <div className="absolute inset-0 opacity-40">
          <SmartImage
            src="/images/lit.png"
            className="w-full h-full object-cover"
            alt="LIT"
          />
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: product area */}
          <div className="lg:col-span-9 order-2 lg:order-1">
            {/* SEARCH BAR */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU, or specifications..."
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:border-[#d11a2a] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500">
                    Found{" "}
                    <span className="text-[#d11a2a] font-black">
                      {filteredProducts.length}
                    </span>{" "}
                    products matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-gray-400 hover:text-[#d11a2a]"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* TABS */}
            <div className="mb-8 flex items-center gap-4 border-b border-gray-100">
              {["CATEGORIES", "APPLICATIONS", "HIGHLIGHTS"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveView(tab)}
                  className={`px-6 py-4 text-[11px] font-black tracking-widest transition-all ${
                    activeView === tab
                      ? "border-b-2 border-[#d11a2a] text-gray-900 -mb-[1px]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#d11a2a]" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* ═══════════════════════════════════════════════════
                    CATEGORIES TAB
                ═══════════════════════════════════════════════════ */}
                {activeView === "CATEGORIES" && (
                  <>
                    {USAGE_GROUPS.map((group) => {
                      const families = groupedCategories[group];
                      if (families.length === 0) return null;

                      // Hide the entire group if no family has products (respects active filters)
                      const visibleFamilies = families.filter(
                        (cat) => countForFamily(cat) > 0,
                      );
                      if (visibleFamilies.length === 0) return null;

                      const isOpen = openUsageGroup === group;

                      return (
                        <div
                          key={group}
                          className="border border-gray-100 rounded-[24px] overflow-hidden"
                        >
                          {/* Usage group header */}
                          <button
                            onClick={() =>
                              setOpenUsageGroup(isOpen ? null : group)
                            }
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-28 h-28 bg-white border rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                                <SmartImage
                                  src={`/images/${group}.png`}
                                  alt={group}
                                  className="w-full h-full object-contain p-2"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="text-left">
                                <h3 className="font-black uppercase italic text-lg">
                                  {group}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-xs">
                                  {USAGE_GROUP_DESCRIPTIONS[group]}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">
                                  {visibleFamilies.length}{" "}
                                  {visibleFamilies.length === 1
                                    ? "FAMILY"
                                    : "FAMILIES"}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown
                                size={20}
                                className="text-gray-400"
                              />
                            </motion.div>
                          </button>

                          {/* Family cards grid — each is a Link */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-[#fcfcfc]"
                              >
                                <div className="px-6 pt-4 pb-6 border-t border-gray-100">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                    Click a product family to view its full
                                    catalogue →
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {families.map((category) => (
                                      <FamilyCard
                                        key={category.id}
                                        category={category}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* Uncategorized families */}
                    {(() => {
                      const categorizedIds = new Set(
                        dbCategories
                          .filter((c) => (c.productUsage || []).length > 0)
                          .map((c) => c.id),
                      );
                      const uncategorized = dbCategories.filter(
                        (c) => !categorizedIds.has(c.id),
                      );
                      if (uncategorized.length === 0) return null;

                      // Hide the section if no uncategorized family has products (respects active filters)
                      const visibleUncategorized = uncategorized.filter(
                        (cat) => countForFamily(cat) > 0,
                      );
                      if (visibleUncategorized.length === 0) return null;

                      const isOpen = openUsageGroup === ("OTHER" as any);

                      return (
                        <div className="border border-gray-100 rounded-[24px] overflow-hidden">
                          <button
                            onClick={() =>
                              setOpenUsageGroup(
                                isOpen ? null : ("OTHER" as any),
                              )
                            }
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-28 h-28 bg-white border rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                                <Star size={32} className="text-gray-200" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-black uppercase italic text-lg">
                                  Other Products
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">
                                  {visibleUncategorized.length} FAMILIES
                                </p>
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown
                                size={20}
                                className="text-gray-400"
                              />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-[#fcfcfc]"
                              >
                                <div className="px-6 pt-4 pb-6 border-t border-gray-100">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {uncategorized.map((cat) => (
                                      <FamilyCard key={cat.id} category={cat} />
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* ═══════════════════════════════════════════════════
                    APPLICATIONS TAB
                ═══════════════════════════════════════════════════ */}
                {activeView === "APPLICATIONS" && (
                  <>
                    {groupedByApplication.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-lg font-bold text-gray-300 uppercase italic">
                          No applications found
                        </p>
                      </div>
                    ) : (
                      groupedByApplication.map(({ appDoc, families }) => {
                        const isOpen = openApplicationId === appDoc.id;

                        // Hide application if no family has products (respects active filters)
                        const visibleFamilies = families.filter(
                          (cat) => countForFamily(cat) > 0,
                        );
                        if (visibleFamilies.length === 0) return null;

                        return (
                          <div
                            key={appDoc.id}
                            className="border border-gray-100 rounded-[24px] overflow-hidden"
                          >
                            {/* Application header */}
                            <button
                              onClick={() =>
                                setOpenApplicationId(isOpen ? null : appDoc.id)
                              }
                              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all"
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-28 h-28 bg-white border rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {appDoc.imageUrl ? (
                                    <SmartImage
                                      src={appDoc.imageUrl}
                                      alt={appDoc.title}
                                      className="w-full h-full object-contain p-2"
                                    />
                                  ) : (
                                    <Star size={32} className="text-gray-200" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <h3 className="font-black uppercase italic text-lg">
                                    {appDoc.title}
                                  </h3>
                                  {appDoc.description && (
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-xs">
                                      {appDoc.description}
                                    </p>
                                  )}
                                  <p className="text-[10px] font-bold text-gray-400 mt-1">
                                    {visibleFamilies.length}{" "}
                                    {visibleFamilies.length === 1
                                      ? "FAMILY"
                                      : "FAMILIES"}
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown
                                  size={20}
                                  className="text-gray-400"
                                />
                              </motion.div>
                            </button>

                            {/* Family cards inside application — each is a Link */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-[#fcfcfc]"
                                >
                                  <div className="px-6 pt-4 pb-6 border-t border-gray-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                      Select a product family to explore →
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {families.map((category) => (
                                        <FamilyCard
                                          key={category.id}
                                          category={category}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* ═══════════════════════════════════════════════════
                    HIGHLIGHTS TAB
                ═══════════════════════════════════════════════════ */}
                {activeView === "HIGHLIGHTS" && (
                  <Highlights
                    products={filteredProducts}
                    addToQuote={addToQuote}
                    quoteCart={quoteCart}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right: filter sidebar */}
          <aside className="lg:col-span-3 order-1 lg:order-2">
            <ProductFilter
              products={products}
              productCount={filteredProducts.length}
              filters={filters}
              setFilters={setFilters}
              activeView={activeView}
            />
          </aside>
        </div>
      </section>

      <Footer />

      {/* ── CART DRAWER ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[2000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase italic leading-none">
                    My Quote List
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">
                    {quoteCart.length} items
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc]">
                {quoteCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <ShoppingBag size={40} className="text-gray-200 mb-4" />
                    <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">
                      Your list is empty
                    </p>
                  </div>
                ) : (
                  quoteCart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-white border border-gray-100 rounded-[24px] items-center shadow-sm"
                    >
                      <div className="w-14 h-14 bg-gray-50 p-2 rounded-xl flex items-center justify-center flex-shrink-0">
                        <SmartImage
                          src={item.mainImage || "/placeholder.svg"}
                          className="max-h-full object-contain"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate italic">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a]"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-xs font-black">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:text-[#d11a2a]"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromQuote(item.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t bg-white">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className={`block w-full py-5 text-center rounded-[20px] font-black uppercase text-[11px] tracking-widest transition-all ${
                    quoteCart.length === 0
                      ? "bg-gray-100 text-gray-300 pointer-events-none"
                      : "bg-[#d11a2a] text-white hover:bg-black shadow-xl shadow-red-500/10"
                  }`}
                >
                  Confirm & Request Quote
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
