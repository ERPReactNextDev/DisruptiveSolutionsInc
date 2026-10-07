"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, where, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc 
} from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Plus, Trash2, Loader2, UploadCloud, Zap, Pencil, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PartnersManager() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  // --- WEBSITE STATES ---
  const [availableWebsites, setAvailableWebsites] = useState<any[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState("Disruptive Solutions Inc"); // Default Filter/View

  // --- FORM STATES ---
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [assignWebsite, setAssignWebsite] = useState(""); // Form assignment
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // 1. FETCH WEBSITES COLLECTION
  useEffect(() => {
    const qWeb = query(collection(db, "websites"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(qWeb, (snapshot) => {
      const webs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableWebsites(webs);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH PARTNERS (FILTERED BY SELECTED WEBSITE)
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "brand_partners"), 
      where("website", "==", selectedWebsite),
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setPartners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [selectedWebsite]);

  const handleEdit = (partner: any) => {
    setEditId(partner.id);
    setName(partner.name);
    setAssignWebsite(partner.website);
    setPreviewUrl(partner.logoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setAssignWebsite("");
    setFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async () => {
    if (!name || !assignWebsite) return toast.error("Punan ang pangalan at website.");
    if (!editId && !file) return toast.error("Pumili ng logo file.");

    setIsSubmitLoading(true);
    const toastId = toast.loading(editId ? "Updating partner..." : "Adding partner...");

    try {
      let finalLogoUrl = previewUrl;
      if (file) {
        finalLogoUrl = await uploadToCloudinary(file);
      }

      const partnerData = {
        name,
        website: assignWebsite,
        logoUrl: finalLogoUrl,
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "brand_partners", editId), partnerData);
        toast.success("Updated successfully!", { id: toastId });
      } else {
        await addDoc(collection(db, "brand_partners"), {
          ...partnerData,
          createdAt: serverTimestamp(),
        });
        toast.success("Added successfully!", { id: toastId });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Process failed.", { id: toastId });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* HEADER & GLOBAL FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-900">
            Partner <span className="text-[#d11a2a]">Slider</span> CMS
          </h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Viewing logos for: <span className="text-[#d11a2a]">{selectedWebsite}</span>
          </p>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <label className="text-[9px] font-black uppercase text-gray-400 ml-1 tracking-widest">Filter by Website</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select 
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 pl-10 pr-4 h-12 rounded-2xl text-xs font-bold outline-none focus:border-[#d11a2a] transition-all appearance-none cursor-pointer shadow-sm"
            >
              <option value="Disruptive Solutions Inc">Disruptive Solutions Inc</option>
              {availableWebsites.map(web => (
                  <option key={web.id} value={web.name}>{web.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT: FORM */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-fit space-y-6 sticky top-10">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
              {editId ? <Pencil size={18} className="text-blue-500" /> : <Plus size={18} className="text-[#d11a2a]" />}
              {editId ? "Edit Partner" : "Add New Logo"}
            </h3>
            {editId && (
              <button onClick={resetForm} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assign Website</label>
              <select 
                value={assignWebsite} 
                onChange={(e) => setAssignWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-12 px-4 text-[11px] font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Target Website</option>
                {availableWebsites.map((web) => (
                  <option key={web.id} value={web.name}>{web.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Partner Name</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 p-4 rounded-xl text-sm font-bold outline-none border-2 border-transparent focus:border-[#d11a2a] transition-all" 
                placeholder="e.g. Samsung"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Logo File</label>
              <div className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group hover:border-[#d11a2a] transition-all cursor-pointer">
                {(file || previewUrl) ? (
                  <SmartImage src={file ? URL.createObjectURL(file) : previewUrl} alt="Product image" className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center text-gray-300">
                    <UploadCloud size={24} className="mx-auto mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Select Image</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitLoading}
              className={`w-full text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${editId ? 'bg-blue-600' : 'bg-black hover:bg-[#d11a2a]'}`}
            >
              {isSubmitLoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              {isSubmitLoading ? "Processing..." : editId ? "Update Partner" : "Sync to Slider"}
            </button>
          </div>
        </div>

        {/* RIGHT: LIST */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Partners in {selectedWebsite} ({partners.length})</h3>
          
          {loading ? (
             <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-gray-200" size={40} /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {partners.map((p) => (
                  <motion.div 
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white border border-gray-100 p-6 rounded-[24px] flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all h-40"
                  >
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => handleEdit(p)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white"><Pencil size={12} /></button>
                      <button onClick={() => confirm("Delete logo?") && deleteDoc(doc(db, "brand_partners", p.id))} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={12} /></button>
                    </div>
                    <SmartImage src={p.logoUrl} className="h-12 w-auto object-contain mix-blend-multiply" alt={p.name} />
                    <p className="mt-3 text-[9px] font-black uppercase text-gray-400 tracking-tighter">{p.name}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
