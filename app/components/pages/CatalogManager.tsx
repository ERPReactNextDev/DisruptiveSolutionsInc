"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, 
  deleteDoc, doc, addDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, Pencil, Trash2, Loader2, X, 
  Save, Folder, FileText, ImagePlus, 
  UploadCloud, CheckCircle2, FileUp, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary"; 

export default function CatalogManager() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form States ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Architecture");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePrev, setImagePrev] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "catalogs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCatalogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT VALIDATION: Check if Title, Image, and PDF are present
    if (!title) return alert("Title is required.");
    if (!existingPdfUrl && !pdfFile) return alert("Technical PDF is required.");

    setLoading(true);
    try {
      // 1. Handle Image Upload
      let finalImageUrl = imagePrev;
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile);
      }

      // 2. Handle PDF Upload (Ensure cloudinary helper uses 'auto' resource type)
      let finalPdfUrl = existingPdfUrl;
      if (pdfFile) {
        finalPdfUrl = await uploadToCloudinary(pdfFile);
      }

      const catalogData = {
        title,
        description,
        category,
        image: finalImageUrl,
        pdfUrl: finalPdfUrl,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "catalogs", editingId), catalogData);
      } else {
        await addDoc(collection(db, "catalogs"), { 
          ...catalogData, 
          createdAt: serverTimestamp() 
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Critical Error: Failed to sync assets to cloud.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("Architecture");
    setImageFile(null);
    setImagePrev(null);
    setPdfFile(null);
    setExistingPdfUrl(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
            Archive <span className="text-[#d11a2a]">Vault</span>
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Asset & Catalog Management</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] transition-all shadow-lg shadow-gray-200"
        >
          <Plus size={18} /> New Collection
        </button>
      </div>

      {/* LIST TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Preview</th>
              <th className="px-8 py-6">Catalog Info</th>
              <th className="px-8 py-6">Resource</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {catalogs.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <SmartImage src={item.image} className="w-full h-full object-cover" alt="" />
                  </div>
                </td>
                <td className="px-8 py-6">
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{item.title}</h4>
                  <span className="text-[9px] font-black text-[#d11a2a] uppercase italic">{item.category}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText size={14} className="text-[#d11a2a]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">PDF SYNCED</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => {
                        setEditingId(item.id); setTitle(item.title); setDescription(item.description);
                        setCategory(item.category); setImagePrev(item.image); setExistingPdfUrl(item.pdfUrl);
                        setIsModalOpen(true);
                    }} className="p-3 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl transition-all"><Pencil size={16}/></button>
                    <button onClick={() => confirm("Delete this catalog?") && deleteDoc(doc(db, "catalogs", item.id))} className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL-HEIGHT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              className="relative bg-white h-screen w-full max-w-xl shadow-2xl overflow-y-auto"
            >
              <div className="p-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl"><Folder size={24}/></div>
                  <h3 className="font-black uppercase italic tracking-tighter text-2xl">Asset Sync</h3>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#d11a2a] flex items-center gap-3 transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  {loading ? "Uploading..." : "Save Changes"}
                </button>
              </div>

              <div className="p-10 space-y-10 pb-20">
                {/* TITLE & CATEGORY */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Catalog Headline</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-black uppercase outline-none border-b-2 border-gray-100 focus:border-[#d11a2a] pb-2 transition-all" placeholder="E.G. INDUSTRIAL SERIES 2026" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Industry Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-50 rounded-xl p-4 text-xs font-black uppercase outline-none cursor-pointer">
                      <option>Architecture</option><option>Industrial</option><option>Technology</option><option>Custom</option>
                    </select>
                  </div>
                </div>

                {/* COVER IMAGE UPLOAD */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                    <ImagePlus size={14}/> Cover Art (JPG/PNG)
                  </label>
                  <div className="relative aspect-[16/9] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden hover:border-[#d11a2a] transition-all group">
                    {imagePrev ? (
                      <SmartImage src={imagePrev} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="text-center text-gray-300 group-hover:text-[#d11a2a]">
                        <UploadCloud size={40} className="mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest block">Upload Visual</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if(f) { setImageFile(f); setImagePrev(URL.createObjectURL(f)); }
                    }} />
                  </div>
                </div>

                {/* PDF FILE UPLOAD - STRICT ONLY PDF */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                    <FileUp size={14}/> Technical Document (PDF ONLY)
                  </label>
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed p-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${ (pdfFile || existingPdfUrl) ? 'border-[#d11a2a] bg-red-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-[#d11a2a]'}`}>
                      { (pdfFile || existingPdfUrl) ? (
                        <div className="relative">
                           <FileText className="text-[#d11a2a]" size={40} />
                           <div className="absolute -right-2 -bottom-2 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                             <CheckCircle2 size={12} />
                           </div>
                        </div>
                      ) : (
                        <FileUp className="text-gray-200" size={40} />
                      ) }
                      <div className="text-center">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                          { (pdfFile || existingPdfUrl) ? "Technical PDF Loaded" : "Click to Upload PDF" }
                        </p>
                        {pdfFile && <p className="text-[9px] font-bold text-[#d11a2a] mt-1 uppercase italic line-clamp-1">{pdfFile.name}</p>}
                        {!pdfFile && !existingPdfUrl && <p className="text-[8px] text-gray-400 mt-1 uppercase">Max size: 10MB</p>}
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type !== "application/pdf") {
                          alert("Invalid format. Please select a PDF file.");
                          return;
                        }
                        setPdfFile(file || null);
                      }} 
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-32 bg-gray-50 rounded-2xl p-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d11a2a]/10 resize-none border-none" placeholder="Brief technical overview..." />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}