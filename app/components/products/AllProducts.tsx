"use client";

import * as React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useEffect, useState, useMemo } from "react";
import { 
  Pencil, 
  Trash2, 
  Loader2, 
  Search, 
  ArrowLeft,
  PlusCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

// UI Components
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Firebase
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { toast } from "sonner";

// SIGURADUHIN NA CAPITAL 'N' ANG FILENAME SA SIDEBAR MO
import AddNewProduct from "./AddnewProduct";
import BulkImportDialog from "../bulkimportdialog";

export function AllProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [websiteFilter, setWebsiteFilter] = useState("All Websites");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Default 50

  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // View States
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  
// --- 1. FETCH DATA ---
useEffect(() => {
  setLoading(true);
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
      setLoading(false);
    },
    (error) => {
      console.error("Fetch error:", error);
      toast.error("Failed to load products");
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);


  // --- 2. FILTER LOGIC ---
const filteredProducts = useMemo(() => {
  return products.filter((p) => {
    const matchesBrand =
      brandFilter === "All Brands" ||
      (Array.isArray(p.brands) ? p.brands.includes(brandFilter) : p.brand === brandFilter);
    const matchesWeb =
      websiteFilter === "All Websites" ||
      (Array.isArray(p.websites) ? p.websites.includes(websiteFilter) : p.website === websiteFilter);
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesWeb && matchesSearch;
  });
}, [products, brandFilter, websiteFilter, searchQuery]);

  // --- 3. PAGINATION LOGIC ---
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]); // Clear selections when filters change
  }, [searchQuery, brandFilter, websiteFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
const paginatedProducts = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
}, [filteredProducts, currentPage, itemsPerPage]);

const uniqueBrands = useMemo(() => {
  const brandsSet = new Set<string>();
  products.forEach((p: any) => {
    if (Array.isArray(p.brands)) p.brands.forEach((b: string) => brandsSet.add(b));
    else if (p.brand) brandsSet.add(p.brand);
  });
  return Array.from(brandsSet).sort();
}, [products]);

const uniqueWebsites = useMemo(() => {
  const websSet = new Set<string>();
  products.forEach((p: any) => {
    if (Array.isArray(p.websites)) p.websites.forEach((w: string) => websSet.add(w));
    else if (p.website) websSet.add(p.website);
  });
  return Array.from(websSet).sort();
}, [products]);

  // --- 4. SELECTION LOGIC ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = paginatedProducts.length > 0 && 
    paginatedProducts.every(p => selectedIds.includes(p.id));

  const isSomeSelected = paginatedProducts.some(p => selectedIds.includes(p.id));

  // --- 5. DELETE ACTIONS ---
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted successfully");
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsDeleting(true);
    const deleteToast = toast.loading(`Deleting ${selectedIds.length} products...`);

    try {
      const batch = writeBatch(db);
      
      selectedIds.forEach(id => {
        const productRef = doc(db, "products", id);
        batch.delete(productRef);
      });

      await batch.commit();
      
      toast.success(`Successfully deleted ${selectedIds.length} products!`, { id: deleteToast });
      setSelectedIds([]);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete some products", { id: deleteToast });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- 6. VIEW ACTIONS ---
  const handleEditClick = (product: any) => {
    setSelectedProduct(product);
    setIsEditing(true);
  };

  const handleAddNewClick = () => {
    setSelectedProduct(null);
    setIsEditing(true);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
    setIsEditing(false);
  };

  // --- RENDER CONDITION ---
  if (isEditing) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
            >
              <ArrowLeft size={16} /> Back to Inventory
            </Button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              {selectedProduct ? `Editing: ${selectedProduct?.name}` : "Adding New Product"}
            </p>
          </div>
        </div>
        <AddNewProduct 
          editData={selectedProduct} 
          onFinished={handleBackToList} 
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 p-2 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 flex items-center gap-2">
            <Package className="text-blue-600" size={28} /> Inventory
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Manage and update your products
          </p>
        </div>
        
        <div className="flex gap-3">
          <BulkImportDialog/>

          <Button 
            onClick={handleAddNewClick}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <PlusCircle className="mr-2 w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* BULK DELETE BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-black text-red-600">{selectedIds.length}</span>
            </div>
            <div>
              <p className="text-sm font-black text-red-900">
                {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Ready for bulk actions
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
            >
              <X size={14} className="mr-1" /> Clear Selection
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} className="mr-1" /> Delete Selected
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[40px] border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                    Delete {selectedIds.length} Products?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    You are about to permanently delete <span className="text-red-500 font-black">{selectedIds.length} products</span>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 pt-4">
                  <AlertDialogCancel className="rounded-2xl border-none bg-slate-100 font-black text-[10px] uppercase tracking-widest h-12 px-6">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkDelete}
                    className="rounded-2xl bg-red-600 hover:bg-red-700 font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-lg shadow-red-200"
                  >
                    Confirm Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            placeholder="Search name or Item Code..." 
            className="pl-10 rounded-xl border-gray-100 bg-gray-50/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="border rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gray-50/50 border-gray-100 outline-none cursor-pointer"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option>All Brands</option>
          {uniqueBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
        </select>

        <select 
          className="border rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gray-50/50 border-gray-100 outline-none cursor-pointer"
          value={websiteFilter}
          onChange={(e) => setWebsiteFilter(e.target.value)}
        >
          <option>All Websites</option>
          {uniqueWebsites.map((web: string) => <option key={web} value={web}>{web}</option>)}
        </select>

        {/* ITEMS PER PAGE FILTER */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Show:
          </span>
          <select 
            className="border rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider bg-blue-50 border-blue-200 text-blue-600 outline-none cursor-pointer"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent border-none">
              {/* CHECKBOX COLUMN */}
              <TableHead className="w-[50px] pl-6 py-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </TableHead>
              <TableHead className="w-[80px] py-4">Image</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Product Info</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Item Code</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Brand / Web</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-60 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                </TableCell>
              </TableRow>
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-60 text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow 
                  key={product.id} 
                  className={`group hover:bg-blue-50/30 transition-all cursor-pointer border-b border-gray-50 ${
                    selectedIds.includes(product.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleEditClick(product)}
                >
                  {/* CHECKBOX */}
                  <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectOne(product.id, checked as boolean)}
                      className="border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>

                  {/* MAIN IMAGE */}
                  <TableCell className="py-4">
                    <div className="w-14 h-14 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                      <SmartImage src={product.mainImage} alt="" className="w-full h-full object-contain" />
                    </div>
                  </TableCell>

                  {/* PRODUCT INFO */}
                  <TableCell>
                    <div className="flex flex-col max-w-[250px]">
                      <span className="font-black text-sm text-gray-900 line-clamp-1">{product.name}</span>
                      <span className="text-[9px] text-blue-600 font-black uppercase tracking-tighter">{product.categories || "No Category"}</span>
                    </div>
                  </TableCell>

                  {/* SKU */}
                  <TableCell className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{product.sku || "---"}</TableCell>

                  {/* BRAND / WEBSITE */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="w-fit text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">
                        {Array.isArray(product.brands) ? product.brands.join(", ") : product.brand || "Generic"}
                      </span>
                      <span className="w-fit text-[8px] font-black bg-blue-50 px-2 py-0.5 rounded text-blue-500 uppercase">
                        {Array.isArray(product.websites) ? product.websites.join(", ") : product.website || "N/A"}
                      </span>
                    </div>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-100 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(product);
                        }}
                      >
                        <Pencil size={14} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            onClick={(e) => e.stopPropagation()} 
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[40px] border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              You are about to delete <span className="text-red-500">{product.name}</span>. This action is permanent.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2 pt-4">
                            <AlertDialogCancel className="rounded-2xl border-none bg-slate-100 font-black text-[10px] uppercase tracking-widest h-12 px-6">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => handleDelete(e, product.id)} 
                              className="rounded-2xl bg-red-600 hover:bg-red-700 font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-lg shadow-red-200"
                            >
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 mb-4">
          {/* Results Info */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>

            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 w-9 rounded-xl text-[11px] font-black transition-all transform active:scale-90 ${
                      currentPage === pageNum 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110" 
                      : "bg-white text-blue-400 border border-slate-100 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}