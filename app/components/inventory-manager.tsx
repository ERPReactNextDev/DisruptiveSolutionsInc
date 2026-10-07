"use client";

import * as React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useEffect, useState } from "react";
import { Pencil, X, ArrowLeft, UploadCloud, ImageIcon, Plus, Trash2 } from "lucide-react";

// Firebase
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------- TYPES ----------------
interface SpecBlock {
  id: number;
  label: string;
  rows: { name: string; value: string }[];
}

// ---------------- CHECKBOX LIST COMPONENT ----------------
// Ito yung nag-aayos ng display na may checkmarks at scroll area
function CheckboxList({ 
  label, 
  selectedItems, 
  setSelectedItems, 
  placeholder 
}: { 
  label: string, 
  selectedItems: string[], 
  setSelectedItems: (items: string[]) => void, 
  placeholder: string 
}) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  // I-update ang options para laging kasama ang selected items (lalo na pag edit mode)
  useEffect(() => {
    setOptions(prev => Array.from(new Set([...prev, ...selectedItems])));
  }, [selectedItems]);

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const addItem = () => {
    if (inputValue.trim() && !options.includes(inputValue.trim())) {
      setOptions([...options, inputValue.trim()]);
      setSelectedItems([...selectedItems, inputValue.trim()]);
      setInputValue("");
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl mb-4">
      <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <label className="text-[11px] font-black uppercase text-blue-600 flex items-center gap-2 tracking-tighter">
          <Plus size={12} /> {label}
        </label>
        <button type="button" onClick={() => setSelectedItems([])} className="text-slate-300 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder={placeholder}
            className="h-10 text-xs rounded-xl border-slate-200 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          />
          <Button type="button" onClick={addItem} size="icon" className="bg-blue-600 rounded-xl h-10 w-10 shrink-0">
            <Plus size={18} />
          </Button>
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {options.length === 0 && (
            <p className="text-[10px] text-slate-400 italic text-center py-4">No {label} added.</p>
          )}
          {options.map((option, idx) => {
            const isChecked = selectedItems.includes(option);
            return (
              <div 
                key={idx} 
                onClick={() => toggleItem(option)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                  isChecked ? "bg-blue-50 border-blue-100 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                  isChecked ? "bg-slate-900 border-slate-900 shadow-md" : "bg-white border-slate-300"
                )}>
                  {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-inner" />}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-tight",
                  isChecked ? "text-blue-700" : "text-slate-500"
                )}>
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ---------------- MAIN COMPONENT ----------------
export function InventoryManager() {
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // FORM STATES
  const [productName, setProductName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [sku, setSku] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [descBlocks, setDescBlocks] = useState<SpecBlock[]>([]);
  const [mainImage, setMainImage] = useState<File | string | null>(null);
  const [galleryImages, setGalleryImages] = useState<(File | string)[]>([]);

  // CHECKBOX STATES
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [websites, setWebsites] = useState<string[]>([]);

  const [products, setProducts] = useState<any[]>([]);

  // Real-time Fetch
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        categories: Array.isArray(d.data().categories) ? d.data().categories : [],
        brands: Array.isArray(d.data().brands) ? d.data().brands : [],
        websites: Array.isArray(d.data().websites) ? d.data().websites : [],
      })));
    });
    return () => unsub();
  }, []);

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setProductName(product.name ?? "");
    setShortDesc(product.shortDescription ?? "");
    setSku(product.sku ?? "");
    setRegPrice(String(product.regularPrice ?? ""));
    setSalePrice(String(product.salePrice ?? ""));
    setDescBlocks(product.technicalSpecs ?? []);
    setMainImage(product.mainImage ?? null);
    
    // ðŸ”¥ Eto yung nagf-fetch ng current values
    setCategories(product.categories || []);
    setBrands(product.brands || []);
    setWebsites(product.websites || []);
    setGalleryImages(product.galleryImages || []);
    
    setView("form");
  };

  const resetForm = () => {
    setEditingId(null);
    setProductName("");
    setShortDesc("");
    setSku("");
    setRegPrice("");
    setSalePrice("");
    setDescBlocks([]);
    setMainImage(null);
    setGalleryImages([]);
    setCategories([]);
    setBrands([]);
    setWebsites([]);
  };

  const handleSave = async () => {
    const toastId = toast.loading(editingId ? "Updating product..." : "Saving...");
    try {
      // Note: Include your upload logic here for Cloudinary/Firebase
      const payload = {
        name: productName,
        shortDescription: shortDesc,
        sku,
        regularPrice: Number(regPrice) || 0,
        categories,
        brands,
        websites,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
      } else {
        await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
      }

      toast.success("Product saved!", { id: toastId });
      resetForm();
      setView("list");
    } catch (e) {
      toast.error("Error saving product");
    }
  };

  if (view === "list") {
    return (
      <div className="p-6 space-y-6 bg-white min-h-screen">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Inventory</h2>
          <Button onClick={() => { resetForm(); setView("form"); }} className="bg-slate-900 rounded-xl">
            <Plus size={16} className="mr-2" /> New Product
          </Button>
        </div>
        <Card className="border-none shadow-xl bg-slate-50/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-white" onClick={() => handleEdit(p)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden border">
                         {p.mainImage && <SmartImage src={p.mainImage} alt="Product image" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold uppercase text-xs">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><code className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">{p.sku}</code></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon"><Pencil size={14} /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => setView("list")} className="rounded-xl">
            <ArrowLeft size={16} className="mr-2" /> Back to List
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl font-black uppercase text-xs h-12 shadow-lg">
            {editingId ? "Update Product" : "Save & Publish"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: FORM FIELDS */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-slate-400">Basic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product Name" className="h-12 rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="h-12 rounded-xl" />
                  <Input value={regPrice} onChange={(e) => setRegPrice(e.target.value)} placeholder="Price" className="h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase text-slate-400">Gallery</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl border-2 border-dashed overflow-hidden relative group">
                      <SmartImage src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="Product image" className="w-full h-full object-cover" />
                      <button onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 text-slate-400">
                    <UploadCloud size={20} />
                    <span className="text-[9px] font-black uppercase mt-1">Add Image</span>
                    <input type="file" multiple className="hidden" onChange={(e) => setGalleryImages([...galleryImages, ...Array.from(e.target.files || [])])} />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: THE CHECKBOX SECTIONS (Tulad ng screenshot mo) */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm rounded-2xl mb-6">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Main Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center relative bg-white overflow-hidden">
                  {mainImage ? (
                    <SmartImage src={typeof mainImage === 'string' ? mainImage : URL.createObjectURL(mainImage)} alt="Product image" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="text-slate-200" size={40} />
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
                </div>
              </CardContent>
            </Card>

            <CheckboxList 
              label="Categories" 
              selectedItems={categories} 
              setSelectedItems={setCategories} 
              placeholder="Add to CATEGORIES..." 
            />

            <CheckboxList 
              label="Application" 
              selectedItems={brands} 
              setSelectedItems={setBrands} 
              placeholder="Add to APPLICATION..." 
            />

            <CheckboxList 
              label="Websites" 
              selectedItems={websites} 
              setSelectedItems={setWebsites} 
              placeholder="Add to WEBSITES..." 
            />

            <Button type="button" variant="outline" className="w-full border-dashed border-2 rounded-xl text-slate-400 font-bold uppercase py-6 hover:bg-slate-100">
               + Add Custom Section
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

