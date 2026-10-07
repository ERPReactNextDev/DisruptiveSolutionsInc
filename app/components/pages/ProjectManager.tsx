"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, Pencil, Trash2, X, Save, 
  UploadCloud, Loader2, Image as ImageIcon, 
  Folder, Layers, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function ProjectCMS() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Industrial");
  
  // File States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePrev, setImagePrev] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPrev, setLogoPrev] = useState<string | null>(null);

  // 1. FETCH DATA
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!imagePrev && !imageFile)) return alert("Project Name and Background Image are required.");

    setIsSyncing(true);
    try {
      let finalImageUrl = imagePrev; 
      if (imageFile) finalImageUrl = await uploadToCloudinary(imageFile);

      let finalLogoUrl = logoPrev;
      if (logoFile) finalLogoUrl = await uploadToCloudinary(logoFile);

      const projectData = {
        title,
        description,
        category,
        imageUrl: finalImageUrl,
        logoUrl: finalLogoUrl,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), projectData);
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp()
        });
      }

      closeModal();
    } catch (error) {
      console.error(error);
      alert("Error syncing project data.");
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditModal = (project: any) => {
    setEditingId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category || "Industrial");
    setImagePrev(project.imageUrl);
    setLogoPrev(project.logoUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("Industrial");
    setImageFile(null);
    setImagePrev(null);
    setLogoFile(null);
    setLogoPrev(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER PANEL - Same as Catalog */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
            Project <span className="text-[#d11a2a]">Forge</span>
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Showcase & Portfolio Console</p>
        </div>
        <button 
          onClick={() => { closeModal(); setIsModalOpen(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] transition-all shadow-lg shadow-gray-200"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* LIST TABLE - Styled to match Catalog Manager */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Preview</th>
              <th className="px-8 py-6">Project Details</th>
              <th className="px-8 py-6">Assets</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#d11a2a]" /></td></tr>
            ) : projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <SmartImage src={project.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                </td>
                <td className="px-8 py-6">
                  <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{project.title}</h4>
                  <span className="text-[9px] font-black text-[#d11a2a] uppercase italic">{project.category || "Industrial"}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    {project.logoUrl && <div className="p-1.5 bg-gray-100 rounded-md"><ImageIcon size={12} className="text-gray-500"/></div>}
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {project.logoUrl ? "Logo Active" : "Bg Only"}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(project)} className="p-3 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl transition-all">
                      <Pencil size={16}/>
                    </button>
                    <button onClick={() => confirm("Delete project?") && deleteDoc(doc(db, "projects", project.id))} className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL-HEIGHT SIDE MODAL - Asset Sync Style */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              className="relative bg-white h-screen w-full max-w-xl shadow-2xl overflow-y-auto"
            >
              {/* STICKY MODAL HEADER */}
              <div className="p-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl"><Layers size={24}/></div>
                  <h3 className="font-black uppercase italic tracking-tighter text-2xl">Project Sync</h3>
                </div>
                <button onClick={handleSubmit} disabled={isSyncing} className="bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#d11a2a] flex items-center gap-3 transition-all disabled:opacity-50">
                  {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  {isSyncing ? "Syncing..." : "Save Project"}
                </button>
              </div>

              <div className="p-10 space-y-10 pb-20">
                {/* PROJECT NAME & CATEGORY */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Project Name</label>
                    <input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="w-full text-2xl font-black uppercase outline-none border-b-2 border-gray-100 focus:border-[#d11a2a] pb-2 transition-all" 
                      placeholder="E.G. NEXT-GEN LOGISTICS HUB" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full bg-gray-50 rounded-xl p-4 text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      <option>Industrial</option>
                      <option>Commercial</option>
                      <option>Architecture</option>
                      <option>Technology</option>
                    </select>
                  </div>
                </div>

                {/* BACKGROUND IMAGE */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                    <ImageIcon size={14}/> Background Cover
                  </label>
                  <div className="relative aspect-[16/9] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden hover:border-[#d11a2a] transition-all group">
                    {imagePrev ? (
                      <SmartImage src={imagePrev} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="text-center text-gray-300 group-hover:text-[#d11a2a]">
                        <UploadCloud size={40} className="mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest block">Upload Background</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if(f) { setImageFile(f); setImagePrev(URL.createObjectURL(f)); }
                    }} />
                  </div>
                </div>

                {/* HOVER LOGO */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                    <Zap size={14}/> Client Logo (Hover State)
                  </label>
                  <div className="relative h-40 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden hover:border-[#d11a2a] transition-all group">
                    {logoPrev ? (
                      <SmartImage src={logoPrev} className="w-32 h-32 object-contain" alt="" />
                    ) : (
                      <div className="text-center text-gray-300 group-hover:text-[#d11a2a]">
                        <ImageIcon size={32} className="mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest block">Upload PNG Logo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if(f) { setLogoFile(f); setLogoPrev(URL.createObjectURL(f)); }
                    }} />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full h-32 bg-gray-50 rounded-2xl p-6 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d11a2a]/10 resize-none border-none" 
                    placeholder="Brief details about the project..." 
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}