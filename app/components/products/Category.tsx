"use client";

import * as React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; 
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy 
} from "firebase/firestore";
import { 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  X, 
  LayoutGrid,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Globe
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function CategoryMaintenance() {
  const CLOUDINARY_UPLOAD_PRESET = "taskflow_preset"; 
  const CLOUDINARY_CLOUD_NAME = "dvmpn8mjh";

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Form States
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [availableWebsites, setAvailableWebsites] = useState<any[]>([]);

  // Filter States
  const [filterWebsite, setFilterWebsite] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, visible, hidden

  useEffect(() => {
    const qWeb = query(collection(db, "websites"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(qWeb, (snapshot) => {
      const webs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableWebsites(webs);
    });
    return () => unsubscribe();
  }, []);

  // --- 1. FETCH DATA (REAL-TIME) ---
  useEffect(() => {
    const q = query(collection(db, "categoriesmaintenance"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. IMAGE UPLOAD LOGIC ---
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { 
      method: "POST", 
      body: formData 
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setWebsite("");
    setImageFile(null);
    setPreviewUrl("");
  };

  // --- 3. EDIT CLICK FUNCTION ---
  const handleEditClick = (cat: any) => {
    setEditId(cat.id);
    setTitle(cat.title);
    setDescription(cat.description);
    setWebsite(cat.website)
    setPreviewUrl(cat.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 4. TOGGLE VISIBILITY ---
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "categoriesmaintenance", id), {
        isActive: !currentStatus,
      });
      toast.success(!currentStatus ? "Category is now Visible" : "Category is now Hidden");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // --- 5. SUBMIT LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Please enter a category title");
    
    setIsSubmitLoading(true);
    const loadingToast = toast.loading(editId ? "Updating category..." : "Creating category...");

    try {
      let finalImageUrl = previewUrl;
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile);
      }

      const categoryData: any = {
        title: title.toUpperCase(),
        description,
        website,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "categoriesmaintenance", editId), categoryData);
        toast.success("Category updated!", { id: loadingToast });
      } else {
        await addDoc(collection(db, "categoriesmaintenance"), {
          ...categoryData,
          isActive: true, 
          createdAt: serverTimestamp(),
        });
        toast.success("New category added!", { id: loadingToast });
      }
      resetForm();
    } catch (error) {
      toast.error("Process failed.", { id: loadingToast });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // --- 6. DELETE LOGIC ---
  const handleDelete = async (id: string) => {
    const deleteToast = toast.loading("Removing category...");
    try {
      await deleteDoc(doc(db, "categoriesmaintenance", id));
      toast.success("Category deleted permanently", { id: deleteToast });
    } catch (error) {
      toast.error("Failed to delete", { id: deleteToast });
    }
  };

  // --- 7. FILTERING LOGIC ---
  const filteredCategories = categories.filter(cat => {
    // Website filter
    const websiteMatch = filterWebsite === "all" || cat.website === filterWebsite;
    
    // Status filter
    const statusMatch = 
      filterStatus === "all" ? true :
      filterStatus === "visible" ? cat.isActive !== false :
      cat.isActive === false;
    
    return websiteMatch && statusMatch;
  });

  // Count statistics
  const stats = {
    total: categories.length,
    visible: categories.filter(c => c.isActive !== false).length,
    hidden: categories.filter(c => c.isActive === false).length,
    byWebsite: availableWebsites.map(web => ({
      name: web.name,
      count: categories.filter(c => c.website === web.name).length
    }))
  };

  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
          <LayoutGrid className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Category Maintenance</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Visibility & Classification Control â€¢ {filteredCategories.length} of {stats.total} categories
          </p>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter Categories</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Website Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <Globe size={10} /> By Website
            </label>
            <select 
              value={filterWebsite} 
              onChange={(e) => setFilterWebsite(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-12 px-4 text-[11px] font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Websites ({stats.total})</option>
              {availableWebsites.map((web) => {
                const count = stats.byWebsite.find(s => s.name === web.name)?.count || 0;
                return (
                  <option key={web.id} value={web.name}>
                    {web.name} ({count})
                  </option>
                );
              })}
              <option value="">Unassigned ({categories.filter(c => !c.website).length})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <Eye size={10} /> By Visibility Status
            </label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "All", count: stats.total },
                { value: "visible", label: "Visible", count: stats.visible },
                { value: "hidden", label: "Hidden", count: stats.hidden }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                    filterStatus === status.value
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status.label} <span className="ml-1 opacity-60">({status.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filterWebsite !== "all" || filterStatus !== "all") && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400">Active Filters:</span>
            {filterWebsite !== "all" && (
              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                <Globe size={10} />
                {filterWebsite || "Unassigned"}
                <button onClick={() => setFilterWebsite("all")} className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                  <X size={10} />
                </button>
              </div>
            )}
            {filterStatus !== "all" && (
              <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                {filterStatus === "visible" ? <Eye size={10} /> : <EyeOff size={10} />}
                {filterStatus}
                <button onClick={() => setFilterStatus("all")} className="ml-1 hover:bg-green-100 rounded-full p-0.5">
                  <X size={10} />
                </button>
              </div>
            )}
            <button 
              onClick={() => {
                setFilterWebsite("all");
                setFilterStatus("all");
              }}
              className="text-[9px] font-black uppercase text-slate-400 hover:text-red-600 ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- FORM --- */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                {editId ? "âœï¸ Edit Category" : "âœ¨ New Category"}
              </h2>
              {editId && <Button onClick={resetForm} variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase">Cancel</Button>}
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PANEL LIGHTS" className="rounded-2xl h-12 font-bold" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." className="rounded-2xl min-h-[100px] text-xs font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assign Website</label>
              <select 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-12 px-4 text-[11px] font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Target Website</option>
                {availableWebsites.map((web) => (
                  <option key={web.id} value={web.name}>
                    {web.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Image Preview</label>
              <div onClick={() => document.getElementById('cat-img')?.click()} className="relative w-full h-44 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all">
                {previewUrl ? <SmartImage src={previewUrl} alt="Product image" className="w-full h-full object-cover" /> : <div className="text-slate-300 flex flex-col items-center"><ImageIcon size={32}/><span className="text-[9px] font-black uppercase mt-2">Upload</span></div>}
                <input type="file" id="cat-img" hidden onChange={handleImageChange} accept="image/*" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitLoading} className="w-full bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] h-14 transition-all">
              {isSubmitLoading ? <Loader2 className="animate-spin" /> : editId ? "Update Category" : "Save Category"}
            </Button>
          </form>
        </div>

        {/* --- GRID LIST --- */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <LayoutGrid size={48} className="opacity-20 mb-4" />
              <p className="font-black uppercase text-sm">No categories found</p>
              <p className="text-[10px] font-bold uppercase mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className={`group bg-white border border-slate-100 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-xl ${cat.isActive === false ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="h-48 bg-slate-100 overflow-hidden relative">
                    <SmartImage src={cat.imageUrl || "https://via.placeholder.com/400x300"} alt="Product image" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    
                    {/* Status Label */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg ${cat.isActive !== false ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'}`}>
                      {cat.isActive !== false ? <><Eye size={10}/> Visible</> : <><EyeOff size={10}/> Hidden</>}
                    </div>

                    {/* Website Badge */}
                    {cat.website && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg">
                        <Globe size={10}/> {cat.website}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button onClick={() => handleEditClick(cat)} size="icon" className="bg-white text-slate-900 rounded-xl h-11 w-11 hover:scale-110 transition-transform"><Pencil size={18} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" className="bg-white text-red-600 rounded-xl h-11 w-11 hover:scale-110 transition-transform"><Trash2 size={18} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[32px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2"> <AlertCircle className="text-red-500"/> Confirm Delete</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest leading-relaxed">Delete {cat.title} permanently?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-2xl bg-slate-100 border-none font-black text-[10px] uppercase h-12 px-6">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cat.id)} className="rounded-2xl bg-red-600 hover:bg-red-700 font-black text-[10px] uppercase h-12 px-6">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-sm uppercase text-slate-900">{cat.title}</h3>
                      <button 
                        onClick={() => toggleVisibility(cat.id, cat.isActive)}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${cat.isActive !== false ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      >
                        {cat.isActive !== false ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase line-clamp-2 leading-relaxed opacity-70">
                      {cat.description || "No description provided."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
