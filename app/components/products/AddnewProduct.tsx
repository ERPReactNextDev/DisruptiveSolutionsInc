"use client";

import * as React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc
} from "firebase/firestore";
import {
  ImagePlus,
  UploadCloud,
  X,
  Loader2,
  AlignLeft,
  Trash2,
  Plus,
  Globe,
  Tag,
  Factory,
  Settings2,
  MoreVertical,
  LinkIcon,
  ImageIcon,
  QrCode,
  RefreshCcw
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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

// --- TYPES ---
interface ListItem { id: string; name: string; }
interface SpecRow { name: string; value: string; }
interface SpecBlock { id: number; label: string; rows: SpecRow[]; }

interface CustomSectionData {
  id: string;
  title: string;
  items: ListItem[];
  selected: string[];
}

interface SidebarSectionProps {
  label: string;
  icon: React.ReactNode;
  items: ListItem[];
  selected: string[];
  onCheck: (value: string) => void;
  val: string;
  setVal: (value: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  customAddLogic?: (val: string) => void;
  isDynamic?: boolean;
  onDeleteSection?: () => void;
  multiSelect?: boolean;
}

interface CatalogItem {
  id: number;
  file?: File;
  existingUrl?: string;
}

interface AddNewProductProps {
  editData?: any;
  onFinished?: () => void;
}

const seoData = {
  title: "Next.js SEO Sample Page",
  description: "Ito ay sample SEO description gamit ang Next.js App Router.",
  keywords: ["nextjs", "seo", "react", "web development"],
  canonical: "https://example.com/sample-page",
  ogImage: "https://example.com/og-image.jpg",
  robots: "index, follow",
};

export default function AddNewProduct({ editData, onFinished }: AddNewProductProps) {
  const CLOUDINARY_UPLOAD_PRESET = "taskflow_preset";
  const CLOUDINARY_CLOUD_NAME = "dvmpn8mjh";
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isPublishing, setIsPublishing] = useState(false);
  const [productName, setProductName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [sku, setSku] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [descBlocks, setDescBlocks] = useState<SpecBlock[]>([
    { id: Date.now(), label: "Technical Specifications", rows: [{ name: "Watts", value: "" }, { name: "Voltage", value: "" }] },
  ]);

  const [categories, setCategories] = useState<ListItem[]>([]);
  const [brands, setBrands] = useState<ListItem[]>([]);
  const [websites, setWebsites] = useState<ListItem[]>([]);
  const [customSections, setCustomSections] = useState<CustomSectionData[]>([]);

  const [newCat, setNewCat] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newWeb, setNewWeb] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedWebs, setSelectedWebs] = useState<string[]>([]);

  const [isAddingNewSection, setIsAddingNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  // IMAGE & FILE STATES
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [existingMainImage, setExistingMainImage] = useState("");
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
  

// QR PRODUCT STATES (Idagdag mo ito sa baba)
const [qrProducts, setQrProducts] = useState<File[]>([]);
const [existingQrProducts, setExistingQrProducts] = useState<string[]>([]);

  // Catalog Items: Combined new and existing
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([{ id: Date.now() }]);

 useEffect(() => {
  const fetchSpecsFromCategory = async () => {
    // 1. KUNIN ANG LATEST CATEGORY
    const latestCat = selectedCats[selectedCats.length - 1];
    
    // 2. SAFETY CHECK: Kung may tinype na ang user, wag basta-basta i-overwrite
    // Pwede nating i-check kung ang unang row ay may laman na
    const hasExistingData = descBlocks.some(block => 
      block.rows.some(row => row.name !== "" || row.value !== "")
    );

    // 3. KUNG NI-UNCHECK LAHAT (Empty na ang array)
    if (selectedCats.length === 0) {
      setDescBlocks([{ 
        id: Date.now(), 
        label: "TECHNICAL SPECIFICATIONS", 
        rows: [{ name: "", value: "" }] 
      }]);
      return;
    }

    // 4. KUNG MAY NATIRA PANG CATEGORY, PERO HINDI PA NATIN NA-LOAD YUNG LATEST
    try {
      const docRef = doc(db, "spec_templates", latestCat);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const savedData = docSnap.data();
        
        // Mag-confirm lang tayo o mag-load kung kailangan talaga
        if (savedData && Array.isArray(savedData.blocks)) {
          const templateBlocks = savedData.blocks.map((block: any) => ({
            id: Date.now() + Math.random(),
            label: block.label || "TECHNICAL SPECIFICATIONS",
            rows: Array.isArray(block.rows) 
              ? block.rows.map((r: any) => ({ 
                  name: r.name || "", 
                  value: r.value || "" 
                }))
              : [{ name: "", value: "" }]
          }));

          setDescBlocks(templateBlocks);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  fetchSpecsFromCategory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedCats]);
  // --- FETCH MASTER DATA ---
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
    const unsubBrands = onSnapshot(collection(db, "brands"), (snap) => {
      setBrands(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
    const unsubWebs = onSnapshot(collection(db, "websites"), (snap) => {
      setWebsites(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
    const unsubCustom = onSnapshot(collection(db, "custom_sections"), (snap) => {
      setCustomSections(snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        items: d.data().items || [],
        selected: [],
      })));
    });
    return () => { unsubCats(); unsubBrands(); unsubWebs(); unsubCustom(); };
  }, []);

  // --- AUTO-FILL LOGIC (EDIT MODE) ---
useEffect(() => {
  if (editData) {
    setProductName(editData.name || "");
    setShortDesc(editData.shortDescription || "");
    setSku(editData.sku || "");
    setRegPrice(editData.regularPrice?.toString() || "");
    setSalePrice(editData.salePrice?.toString() || "");
    setDescBlocks(editData.technicalSpecs || []);

    // 🔥 FIX: Siguraduhing arrays ang kinukuha base sa payload na sinave mo
    setSelectedCats(Array.isArray(editData.categories) ? editData.categories : []);
    setSelectedBrands(Array.isArray(editData.brands) ? editData.brands : []);
    setSelectedWebs(Array.isArray(editData.websites) ? editData.websites : []);

    setExistingMainImage(editData.mainImage || "");
    setExistingGalleryImages(editData.galleryImages || []);

    // --- START QR AUTO-FILL ---
    // Hinuhugot natin yung qrProductImages array mula sa database
    setExistingQrProducts(editData.qrProductImages || []);
    // --- END QR AUTO-FILL ---

    if (editData.catalogs?.length) {
      const loaded = editData.catalogs.map((url: string, i: number) => ({
        id: i,
        existingUrl: url
      }));
      setCatalogs([...loaded, { id: Date.now() }]);
    } else {
      setCatalogs([{ id: Date.now() }]);
    }

    // Dynamic Specs mapping
    if (editData.dynamicSpecs && customSections.length > 0) {
      setCustomSections((prevSections) =>
        prevSections.map((section) => {
          const matchingValues = editData.dynamicSpecs
            .filter((spec: any) => spec.title === section.title)
            .map((spec: any) => spec.value);
          return { ...section, selected: matchingValues };
        })
      );
    }
  }
}, [editData, customSections.length]); // Tinanggal natin ang customSections.length > 0 para mas clean

  // Siguraduhin na may 'setSeoData' at may 'slug' sa loob ng object
  const [seoDataState, setSeoData] = useState({
    title: editData?.seo?.title || "",
    description: editData?.seo?.description || "",
    slug: editData?.slug || "", // Idagdag ito para mawala yung 'Property slug does not exist'
    keywords: editData?.seo?.keywords || [],
    canonical: editData?.seo?.canonical || "",
    ogImage: editData?.seo?.ogImage || "",
    robots: editData?.seo?.robots || "index, follow",
  });
  // --- CLOUDINARY UPLOAD ---
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  // --- ACTIONS ---
  const handleQuickAdd = async (colName: string, val: string, setVal: (v: string) => void) => {
    if (!val.trim()) return;
    try {
      await addDoc(collection(db, colName), { name: val.trim(), createdAt: serverTimestamp() });
      setVal("");
      toast.success("Added to database");
    } catch (err) { toast.error("Failed to add"); }
  };

  const handleDeleteItem = async (colName: string, id: string) => {
    try {
      await deleteDoc(doc(db, colName, id));
      toast.success("Deleted successfully");
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleAddChoiceToCustom = async (sectionId: string, choiceName: string) => {
    if (!choiceName.trim()) return;
    try {
      const sectionRef = doc(db, "custom_sections", sectionId);
      await updateDoc(sectionRef, { items: arrayUnion({ id: Date.now().toString(), name: choiceName }) });
    } catch (err) { toast.error("Error adding choice"); }
  };

  const handleCreateNewSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await addDoc(collection(db, "custom_sections"), { title: newSectionTitle.toUpperCase(), items: [], createdAt: serverTimestamp() });
      setNewSectionTitle("");
      setIsAddingNewSection(false);
      toast.success("New section added");
    } catch (err) { toast.error("Error creating section"); }
  };

  

 // --- PUBLISH / UPDATE PRODUCT ---
const handlePublish = async () => {
  // Check kung may productName at slug
  if (!productName || !seoDataState.slug) return toast.error("Product Name and Slug are required!");
  if (!mainImage && !existingMainImage) return toast.error("Main Image is missing!");

  setIsPublishing(true);
  const publishToast = toast.loading(editData ? "Updating Product..." : "Publishing Product...");

  try {
    // 1. Upload Images
    const mainUrl = mainImage ? await uploadToCloudinary(mainImage) : existingMainImage;
    const newlyUploadedGallery = await Promise.all(galleryImages.map(img => uploadToCloudinary(img)));
    const finalGalleryUrls = [...existingGalleryImages, ...newlyUploadedGallery];

    // --- START QR LOGIC ---
    // Mag-upload ng mga bagong piniling QR images sa Cloudinary
    const newlyUploadedQr = await Promise.all(qrProducts.map(img => uploadToCloudinary(img)));
    // Pagsamahin ang mga existing URLs at yung mga bagong upload
    const finalQrUrls = [...existingQrProducts, ...newlyUploadedQr];
    // --- END QR LOGIC ---

    // 2. Upload Catalogs
    const finalCatalogUrls = await Promise.all(
      catalogs.map(async (c) => {
        if (c.file) return await uploadToCloudinary(c.file);
        return c.existingUrl || null;
      })
    );

    // 3. Process Specs
    const dynamicSpecs = customSections.flatMap((section) =>
      section.selected.map((val) => ({ title: section.title, value: val }))
    );

    // 4. Create Product Payload
    const productPayload = {
      name: productName,
      shortDescription: shortDesc,
      slug: seoDataState.slug,
      sku,
      regularPrice: Number(regPrice) || 0,
      salePrice: Number(salePrice) || 0,
      technicalSpecs: descBlocks,
      dynamicSpecs,
      mainImage: mainUrl,
      galleryImages: finalGalleryUrls,
      
      // --- SAVE QR URLS TO PAYLOAD ---
      qrProductImages: finalQrUrls, 
      
      catalogs: finalCatalogUrls.filter(Boolean),
      categories: selectedCats,
      brands: selectedBrands,
      websites: selectedWebs,

      seo: {
        title: seoDataState.title || productName,
        description: seoDataState.description,
        canonical: seoDataState.canonical,
        lastUpdated: new Date().toISOString()
      },

      updatedAt: serverTimestamp(),
    };

    // 5. Save to Firestore
    if (editData?.id) {
      await updateDoc(doc(db, "products", editData.id), productPayload);
      toast.success("Product Updated Successfully!", { id: publishToast });
    } else {
      await addDoc(collection(db, "products"), {
        ...productPayload,
        createdAt: serverTimestamp()
      });
      toast.success("Product Published Successfully!", { id: publishToast });
    }

    if (onFinished) onFinished();
  } catch (error) {
    console.error("Publish Error:", error);
    toast.error("Process failed. Please try again.", { id: publishToast });
  } finally {
    setIsPublishing(false);
  }
};

  const toggleValue = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-gradient-to-b from-white via-slate-50 to-white min-h-screen">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-8">
        {/* HEADER */}
       <div className="mb-8 flex justify-between items-start">
  <div>
    <h1 className="text-4xl font-black text-slate-900 mb-2">
      {editData ? "Edit Product" : "Add New Product"}
    </h1>
    <p className="text-slate-500 text-sm">
      Fill in the product details and media to publish
    </p>
  </div>

  <Button
    variant="outline"
    size="sm"
    onClick={async () => {
      // 1. Check muna kung edit mode (kung may existing product)
      if (editData?.id) {
        try {
          const productRef = doc(db, "products", editData.id); // Siguraduhin na "products" ang collection name mo
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const pData = productSnap.data();
            
            // 2. I-fetch ang 'technicalSpecs' field mula sa actual product document
            if (pData.technicalSpecs && Array.isArray(pData.technicalSpecs)) {
              const fetchedSpecs = pData.technicalSpecs.map((block: any) => ({
                id: block.id || Date.now() + Math.random(),
                label: block.label || "TECHNICAL SPECIFICATIONS",
                rows: Array.isArray(block.rows) 
                  ? block.rows.map((r: any) => ({ 
                      name: r.name || "", 
                      value: r.value || "" 
                    }))
                  : [{ name: "", value: "" }]
              }));

              setDescBlocks(fetchedSpecs);
              toast.success("Specs re-synced from Product Database!");
            } else {
              toast.info("No technical specs found for this product.");
            }
          }
        } catch (error) {
          console.error("Sync Error:", error);
          toast.error("Failed to fetch technical specs.");
        }
      } else {
        // 3. Fallback: Kung hindi edit mode, sabihan si user na select muna ng category/product
        toast.warning("Sync only works for existing products in Edit mode.");
      }
    }}
    className="flex items-center gap-2 border-2 border-slate-200 text-slate-600 font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all rounded-xl h-12 px-5 active:scale-95 text-[10px] uppercase tracking-wider"
  >
    <RefreshCcw className="w-4 h-4" />
    REFRESH SPECS
  </Button>
</div>

        <Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 px-8 py-6">
            <CardTitle className="flex items-center gap-3 text-slate-900 font-black text-sm uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div> General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-slate-600 tracking-tight">Product Name*</Label>
              <Input className="h-12 text-base font-semibold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 bg-white" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name..." />
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-slate-600 tracking-tight">Short Description</Label>
              <Input className="h-12 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0 bg-white" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Brief highlight of the product..." />
            </div>

           {/* SPECS BLOCKS */}
<div className="space-y-6 pt-4 border-t-2 border-slate-100">
  {descBlocks.map((block, bIdx) => (
    <div key={block.id} className="p-6 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white hover:border-blue-300 transition-colors">
      <Input 
        className="mb-6 h-10 text-xs font-black uppercase w-full bg-white border-2 border-slate-200 rounded-lg focus:border-blue-500" 
        value={block.label} 
        onChange={(e) => { const nb = [...descBlocks]; nb[bIdx].label = e.target.value; setDescBlocks(nb); }} 
      />
      <div className="space-y-3">
        {block.rows.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-12 gap-3 items-center">
            <Input className="col-span-5 h-10 text-xs font-semibold border-2 border-slate-200 rounded-lg focus:border-blue-500" value={row.name} onChange={(e) => { const nb = [...descBlocks]; nb[bIdx].rows[rIdx].name = e.target.value; setDescBlocks(nb); }} placeholder="e.g. Watts" />
            <Input className="col-span-6 h-10 text-xs border-2 border-slate-200 rounded-lg focus:border-blue-500" value={row.value} onChange={(e) => { const nb = [...descBlocks]; nb[bIdx].rows[rIdx].value = e.target.value; setDescBlocks(nb); }} placeholder="e.g. 50W" />
            <button onClick={() => { const nb = [...descBlocks]; nb[bIdx].rows = nb[bIdx].rows.filter((_, i) => i !== rIdx); setDescBlocks(nb); }} className="col-span-1 flex justify-center items-center hover:scale-110 transition-transform"><Trash2 className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg h-10 bg-transparent" onClick={() => { const nb = [...descBlocks]; nb[bIdx].rows.push({ name: "", value: "" }); setDescBlocks(nb); }}>+ Add Row</Button>
      </div>
    </div>
  ))}

  {/* ACTION BUTTONS: ADD ROW & REFRESH TEMPLATE */}
  <div className="flex gap-3">
    <Button 
      variant="outline" 
      size="sm" 
      className="flex-1 text-[10px] font-bold border-dashed border-2 bg-transparent h-12" 
      onClick={() => { const nb = [...descBlocks]; nb.push({ id: Date.now(), label: "", rows: [{ name: "", value: "" }] }); setDescBlocks(nb); }}
    >
      <Plus className="w-4 h-4 mr-2" /> ADD NEW SPEC BLOCK
    </Button>
  </div>
</div>

            {/* CATALOGS SECTION */}
            <div className="space-y-5 pt-6 border-t-2 border-slate-100">
              <Label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Catalogs & Manuals (PDF / Images)</Label>
              <div className="grid grid-cols-1 gap-3">
                {catalogs.map((cat, index) => (
                  <div key={cat.id} className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between group hover:border-blue-400 transition-colors">
                    <label className="cursor-pointer flex-1">
                      {cat.file ? (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-2"><UploadCloud size={16} className="text-emerald-500" /> {cat.file.name}</p>
                      ) : cat.existingUrl ? (
                        <a href={cat.existingUrl} target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-2"><LinkIcon size={14} /> View File ({index + 1})</a>
                      ) : (
                        <div className="flex items-center gap-3 text-slate-500">
                          <Plus size={18} className="text-slate-400" />
                          <span className="text-xs font-semibold uppercase">Attach Catalog</span>
                        </div>
                      )}
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setCatalogs(prev => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], file };
                          if (index === prev.length - 1) updated.push({ id: Date.now() });
                          return updated;
                        });
                      }} />
                    </label>
                    {(cat.file || cat.existingUrl) && (
                      <button onClick={() => setCatalogs(prev => prev.filter(c => c.id !== cat.id))} className="text-slate-400 hover:text-red-500 transition-colors hover:scale-110 transform">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GALLERY SECTION */}
            <div className="space-y-5 pt-6 border-t-2 border-slate-100">
              <Label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Gallery Images</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Existing Images */}
                {existingGalleryImages.map((url, index) => (
                  <div key={`ex-${index}`} className="relative border-2 border-slate-200 rounded-lg p-1 bg-white h-32 group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <SmartImage src={url || "/placeholder.svg"} alt={`Gallery ${index}`} className="object-contain h-full w-full rounded" />
                    <button onClick={() => setExistingGalleryImages(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"><X size={14} /></button>
                  </div>
                ))}
                {/* New Image Previews */}
                {galleryImages.map((img, index) => (
                  <div key={`new-${index}`} className="relative border-2 border-blue-300 rounded-lg p-1 bg-blue-50 h-32 group overflow-hidden shadow-sm">
                    <SmartImage src={URL.createObjectURL(img) || "/placeholder.svg"} alt={`New gallery ${index}`} className="object-contain h-full w-full rounded" />
                    <button onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"><X size={14} /></button>
                  </div>
                ))}
                <label className="border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all text-blue-500 group">
                  <ImagePlus size={28} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase mt-2">Add Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setGalleryImages(prev => [...prev, file]); }} />
                </label>
              </div>
            </div>
            {/* QR IMAGE SECTION */}
<div className="space-y-4 pt-4 border-t border-slate-100">
  <Label className="text-[11px] font-black uppercase text-slate-500">Product QR Images</Label>
  
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {/* Existing QR Images (Mula sa Database) */}
    {existingQrProducts.map((url: string, index: number) => (
      <div key={`ex-qr-${index}`} className="relative border-2 border-slate-200 rounded-lg p-1 bg-white h-32 group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <SmartImage src={url || "/placeholder.svg"} className="object-contain h-full w-full rounded" alt="QR Product" />
        <button 
          type="button"
          onClick={() => setExistingQrProducts((prev: string[]) => prev.filter((_, i) => i !== index))} 
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"
        >
          <X size={14} />
        </button>
      </div>
    ))}

    {/* New QR Image Previews (Yung kakapili lang sa Folder) */}
    {qrProducts.map((img: File, index: number) => (
      <div key={`new-qr-${index}`} className="relative border-2 border-emerald-300 rounded-lg p-1 bg-emerald-50 h-32 overflow-hidden shadow-sm">
        <SmartImage src={URL.createObjectURL(img) || "/placeholder.svg"} className="object-contain h-full w-full rounded" alt="New QR Preview" />
        <button 
          type="button"
          onClick={() => setQrProducts((prev: File[]) => prev.filter((_, i) => i !== index))} 
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 text-white shadow-lg hover:scale-110 transition-transform"
        >
          <X size={14} />
        </button>
      </div>
    ))}

    {/* Upload Trigger */}
    <label className="border-2 border-dashed border-emerald-300 rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all text-emerald-600 group">
      <QrCode size={28} className="group-hover:scale-110 transition-transform" />
      <span className="text-xs font-bold uppercase mt-2">Upload QR Image</span>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { 
          const file = e.target.files?.[0]; 
          if (file) setQrProducts((prev: File[]) => [...prev, file]); 
        }} 
      />
    </label>
  </div>
</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6 border-t-2 border-slate-100">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Regular Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-bold">₱</span>
                  <Input className="h-11 pl-7 text-sm font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0" value={regPrice} onChange={(e) => setRegPrice(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Sale Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-bold">₱</span>
                  <Input className="h-11 pl-7 text-sm font-bold text-emerald-600 border-2 border-emerald-300 rounded-lg focus:border-emerald-500 focus:ring-0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Item Code / Model</Label>
                <Input className="h-11 text-sm font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-0" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g., TB101" />
              </div>
            </div>
          </CardContent>
        </Card>
<Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white sticky top-8">
  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 px-6 py-6">
    <CardTitle className="flex items-center gap-3 text-slate-900 font-black text-sm uppercase tracking-wider">
      <div className="w-2 h-2 rounded-full bg-emerald-600"></div> SEO Settings
    </CardTitle>
  </CardHeader>

  <CardContent className="p-6 space-y-6">
    {/* --- INPUT SECTION --- */}
    <div className="space-y-5 border-b border-slate-100 pb-6">
      <div className="space-y-2.5">
        <label className="text-slate-700 font-bold text-xs uppercase tracking-tight">SEO Title</label>
        <input
          type="text"
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-700 text-sm font-medium"
          value={seoDataState.title}
          onChange={(e) => setSeoData({ ...seoDataState, title: e.target.value })}
          placeholder="Product name for Google"
        />
      </div>

     <div className="space-y-2.5">
  <label className="text-slate-700 font-bold text-xs uppercase tracking-tight flex items-center gap-2">
    URL Slug
    <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">No slashes</span>
  </label>
  <input
    type="text"
    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-900 font-mono text-sm"
    value={seoDataState.slug}
    onChange={(e) => {
      const sanitizedValue = e.target.value
        .toLowerCase()
        .replace(/\//g, "") 
        .replace(/\s+/g, "-");

      setSeoData({ ...seoDataState, slug: sanitizedValue });
    }}
    placeholder="e.g., downlight-pro-v1"
  />
</div>
      <div className="space-y-2.5">
        <label className="text-slate-700 font-bold text-xs uppercase tracking-tight">Meta Description</label>
        <textarea
          rows={3}
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-700 text-sm font-medium resize-none"
          value={seoDataState.description}
          onChange={(e) => setSeoData({ ...seoDataState, description: e.target.value })}
          placeholder="Brief summary for search results..."
        />
      </div>
    </div>

    {/* --- LIVE PREVIEW SECTION --- */}
    <div className="pt-2">
      <div className="flex items-center gap-6 mb-4">
        <span className="text-[10px] font-black uppercase text-slate-400">Google Preview:</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
            <input 
              type="radio" 
              name="view" 
              checked={previewMode === 'mobile'} 
              onChange={() => setPreviewMode('mobile')}
              className="text-blue-500" 
            /> Mobile
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
            <input 
              type="radio" 
              name="view" 
              checked={previewMode === 'desktop'} 
              onChange={() => setPreviewMode('desktop')}
              className="text-blue-500" 
            /> Desktop
          </label>
        </div>
      </div>

      {/* Google Card Simulation */}
      <div className={`p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[360px]' : 'max-w-[600px]'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center border border-slate-100">
            <SmartImage src="/favicon.ico" className="w-3 h-3 grayscale opacity-50" alt="icon" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] text-[#202124] leading-tight font-medium">Disruptive Solutions Inc</p>
            <p className="text-[11px] text-[#4d5156] truncate">disruptive-solutions-inc.vercel.app › {selectedBrands || '...'} › {seoDataState.slug || '...'}</p>
          </div>
        </div>

<div className={`mt-2 ${previewMode === 'mobile' ? 'flex flex-col-reverse gap-2' : 'flex gap-4'}`}>
  <div className="flex-1">
    {/* SEO TITLE LINK - Clickable at safe sa Array Error */}
    <a
      href={`http://localhost:3000/${selectedBrands[0]?.toLowerCase() || 'brand'}/${seoDataState.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1 line-clamp-2 font-medium block"
    >
      {seoDataState.title || "Enter an SEO Title..."}
    </a>
    <p className="text-[13px] text-[#4d5156] line-clamp-3 leading-relaxed">
      {seoDataState.description || "Enter a meta description to see how it looks here. This text will help customers find your product on Google."}
    </p>
  </div>
  
  {/* THUMBNAIL PREVIEW - Ginawa nating clickable din */}
  <a 
    href={`http://localhost:3000/${selectedBrands[0]?.toLowerCase() || 'brand'}/${seoDataState.slug}`}
    target="_blank"
    rel="noopener noreferrer"
    className="w-[104px] h-[104px] flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative group block"
  >
    {mainImage || existingMainImage ? (
      <SmartImage 
        src={mainImage ? URL.createObjectURL(mainImage) : existingMainImage} 
        className="w-full h-full object-contain p-1" 
        alt="SEO Thumb" 
      />
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
        <ImageIcon size={24} />
      </div>
    )}
    
    {/* Hover Overlay */}
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
      <span className="text-[8px] text-white font-black uppercase">Preview Only</span>
    </div>
  </a>
</div>
      </div>
    </div>
  </CardContent>
</Card>
        

      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-8">
        {/* Main Featured Image */}
        <Card className="border-0 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 px-6 py-4"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Main Product Image</CardTitle></CardHeader>
          <CardContent className="pt-8 pb-6">
            <Label htmlFor="main-file" className="cursor-pointer block group">
              <div className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-all overflow-hidden bg-white group-hover:ring-2 group-hover:ring-blue-200">
                {mainImage ? <SmartImage src={URL.createObjectURL(mainImage) || "/placeholder.svg"} alt="Main" className="w-full h-full object-contain p-3" /> : existingMainImage ? <SmartImage src={existingMainImage || "/placeholder.svg"} alt="Main" className="w-full h-full object-contain p-3" /> : <div className="text-center"><ImagePlus className="w-14 h-14 mb-3 text-blue-400 mx-auto opacity-40 group-hover:scale-110 transition-transform" /><span className="text-xs font-bold uppercase text-slate-500 block">Click to Upload</span></div>}
              </div>
              <input type="file" id="main-file" className="hidden" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
            </Label>
          </CardContent>
        </Card>

        {/* Classification Sidebar */}
        <Card className="border-0 rounded-2xl shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100 px-6 py-4"><CardTitle className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Classification</CardTitle></CardHeader>
          <CardContent className="space-y-6 pt-6">
            <SidebarSection
              label="Target Website"
              icon={<Globe className="w-3 h-3" />}
              items={websites}
              selected={selectedWebs}
              multiSelect
              onCheck={(v: string) => toggleValue(v, setSelectedWebs)}
              val={newWeb}
              setVal={setNewWeb}
              onAdd={() => handleQuickAdd("websites", newWeb, setNewWeb)}
              onDelete={(id: string) => handleDeleteItem("websites", id)}
            />
            <SidebarSection
              label="Product Family"
              icon={<Tag className="w-3 h-3" />}
              items={categories}
              selected={selectedCats}
              multiSelect
              onCheck={(v: string) => toggleValue(v, setSelectedCats)}
              val={newCat}
              setVal={setNewCat}
              onAdd={() => handleQuickAdd("categories", newCat, setNewCat)}
              onDelete={(id: string) => handleDeleteItem("categories", id)}
            />
            <SidebarSection
              label="Brand"
              icon={<Factory className="w-3 h-3" />}
              items={brands}
              selected={selectedBrands}
              multiSelect
              onCheck={(v: string) => toggleValue(v, setSelectedBrands)}
              val={newBrand}
              setVal={setNewBrand}
              onAdd={() => handleQuickAdd("brands", newBrand, setNewBrand)}
              onDelete={(id: string) => handleDeleteItem("brands", id)}
            />

            {/* Dynamic Custom Sections */}
            <div className="pt-4 border-t border-slate-100 space-y-6">
              <Label className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1"><Settings2 size={12} /> Attribute Sections</Label>
              {customSections.map((sec) => (
                <div key={sec.id} className="relative p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <SidebarSection
                    label={sec.title} icon={<Plus className="w-3 h-3 text-blue-500" />} items={sec.items} selected={sec.selected} multiSelect={true}
                    onCheck={(v: string) => setCustomSections(prev => prev.map(s => s.id === sec.id ? { ...s, selected: s.selected.includes(v) ? s.selected.filter(item => item !== v) : [...s.selected, v] } : s))}
                    val={""} setVal={() => { }} onAdd={() => { }}
                    onDelete={async (itemId: string) => {
                      const sRef = doc(db, "custom_sections", sec.id);
                      await updateDoc(sRef, { items: sec.items.filter(i => i.id !== itemId) });
                    }}
                    customAddLogic={(val: string) => handleAddChoiceToCustom(sec.id, val)} isDynamic={true} onDeleteSection={() => handleDeleteItem("custom_sections", sec.id)}
                  />
                </div>
              ))}

              {!isAddingNewSection ? (
                <Button variant="outline" className="w-full h-10 border-dashed border-2 rounded-xl text-[10px] font-black text-slate-400 hover:text-blue-500 bg-transparent" onClick={() => setIsAddingNewSection(true)}>+ ADD CUSTOM SECTION</Button>
              ) : (
                <div className="p-3 bg-white rounded-2xl border-2 border-blue-100 shadow-lg animate-in zoom-in duration-200">
                  <Input placeholder="SECTION TITLE..." className="h-8 text-[10px] font-black rounded-lg border-none bg-slate-50 uppercase" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleCreateNewSection} className="flex-1 h-7 bg-blue-600 rounded-lg text-[10px] font-bold text-white">SAVE</Button>
                    <Button onClick={() => setIsAddingNewSection(false)} variant="ghost" className="h-7 rounded-lg text-[10px] font-bold">CANCEL</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button 
          disabled={isPublishing} 
          onClick={handlePublish} 
          className="w-full bg-gradient-to-r from-[#d11a2a] to-[#b01622] hover:from-[#b01622] hover:to-[#901220] h-14 rounded-xl font-black uppercase tracking-widest text-white shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-base"
        >
          {isPublishing ? <React.Fragment><Loader2 className="animate-spin mr-3 w-5 h-5" /> Processing...</React.Fragment> : editData ? "✓ Update Product" : "✓ Publish Product"}
        </Button>
      </div>
    </div>
  );
}

function SidebarSection({ label, icon, items, selected, onCheck, val, setVal, onAdd, onDelete, customAddLogic, isDynamic, onDeleteSection }: SidebarSectionProps) {
  const [localVal, setLocalVal] = useState("");
  const handleInnerAdd = () => { if (isDynamic && customAddLogic) { customAddLogic(localVal); setLocalVal(""); } else { onAdd(); } };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1">{icon} {label}</Label>
        {isDynamic && (
          <AlertDialog>
            <AlertDialogTrigger asChild><button className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase italic">Delete Section?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">This will remove the <b>{label}</b> section permanently.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel className="rounded-xl text-[10px] uppercase font-bold">Cancel</AlertDialogCancel><AlertDialogAction onClick={onDeleteSection} className="rounded-xl bg-red-600 text-[10px] uppercase font-bold">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="flex gap-1">
        <Input className="h-7 text-[10px] bg-white rounded-lg" placeholder={`Add to ${label}...`} value={isDynamic ? localVal : val} onChange={(e) => isDynamic ? setLocalVal(e.target.value) : setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInnerAdd()} />
        <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 rounded-lg shadow-sm" onClick={handleInnerAdd}><Plus className="w-4 h-4 text-white" /></Button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto pr-2 border-l-2 border-slate-100 pl-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center justify-between group p-1.5 rounded-lg transition-all ${selected.includes(item.name) ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}>
            <div className="flex items-center space-x-2">
              <Checkbox id={item.id} checked={selected.includes(item.name)} onCheckedChange={() => onCheck(item.name)} />
              <Label htmlFor={item.id} className={`text-[11px] font-bold cursor-pointer ${selected.includes(item.name) ? 'text-blue-700' : 'text-slate-600'}`}>{item.name}</Label>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild><button className="opacity-0 group-hover:opacity-100 p-1"><X className="w-3 h-3 text-red-300 hover:text-red-500" /></button></AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black uppercase italic">Delete Item?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-medium">Are you sure you want to delete <b>{item.name}</b>?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="rounded-xl text-[10px] uppercase font-bold">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(item.id)} className="rounded-xl bg-red-600 text-[10px] uppercase font-bold">Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  );
}
