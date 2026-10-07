"use client";

import React, { useEffect, useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import { 
    collection, query, orderBy, onSnapshot, updateDoc, 
    doc, deleteDoc, where, limit 
} from "firebase/firestore";
import { 
    Mail, Phone, MapPin, Package, Clock, User, 
    Trash2, CheckCircle2, Search, Calendar, 
    ListFilter, ChevronRight, X, RotateCcw, MessageSquare,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BroadcastDialog from "../BroadcastDialog";

export default function InquiriesPanel() {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewLimit, setViewLimit] = useState(20);
    const [dateFilter, setDateFilter] = useState("");
    const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(
            collection(db, "inquiries"), 
            where("type", "==", "product"),
            orderBy("createdAt", "desc"),
            limit(viewLimit)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setInquiries(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [viewLimit]);

    // --- LOGIC FUNCTIONS ---
    const updateStatus = async (id: string, nextStatus: string) => {
        try {
            await updateDoc(doc(db, "inquiries", id), { status: nextStatus });
            if(selectedInquiry?.id === id) {
                setSelectedInquiry({...selectedInquiry, status: nextStatus});
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleNextStage = (inq: any) => {
        if (inq.status === "pending") {
            updateStatus(inq.id, "reviewed");
        } else if (inq.status === "reviewed") {
            if (confirm("Move this order to Finished? This action will mark it as complete.")) {
                updateStatus(inq.id, "finished");
            }
        }
    };

    const handleUndo = (id: string) => {
        if (confirm("Revert this order back to Reviewed status?")) {
            updateStatus(id, "reviewed");
        }
    };

    const filteredInquiries = inquiries.filter(inq => {
        const fullName = `${inq.customerDetails?.firstName} ${inq.customerDetails?.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase());
        const matchesDate = dateFilter ? inq.createdAt?.toDate().toISOString().split('T')[0] === dateFilter : true;
        return matchesSearch && matchesDate;
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header & Control Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Order Management</h2>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Total: {inquiries.length}</span>
                        <span className="flex items-center gap-1"><Search size={12}/> Results: {filteredInquiries.length}</span>
                    </div>
                </div>

                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="date" onChange={(e) => setDateFilter(e.target.value)} className="pl-9 pr-4 py-2.5 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer" />
                    </div>
                    <div className="relative">
                        <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select value={viewLimit} onChange={(e) => setViewLimit(Number(e.target.value))} className="pl-9 pr-8 py-2.5 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer appearance-none">
                            {[20, 50, 100, 200, 1000].map(v => <option key={v} value={v}>Limit {v}</option>)}
                        </select>
                    </div>
                    <BroadcastDialog/>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                    type="text" placeholder="Search customer name..." 
                    className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-50/50 font-medium transition-all text-slate-700"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Main List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <Clock className="animate-spin mx-auto text-indigo-500" size={40} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Fetching Data...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredInquiries.map((inq) => (
                            <motion.div
                                key={inq.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border border-slate-100 rounded-[2rem] p-5 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center gap-6 cursor-pointer group relative overflow-hidden"
                                onClick={() => setSelectedInquiry(inq)}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${inq.status === 'finished' ? 'bg-blue-500' : inq.status === 'reviewed' ? 'bg-green-500' : 'bg-orange-400'}`} />

                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all shrink-0">
                                    <User size={24} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate uppercase text-sm tracking-tight">{inq.customerDetails?.firstName} {inq.customerDetails?.lastName}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Package size={10} /> {inq.items?.length || 0} Items
                                        </p>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${inq.status === 'finished' ? 'bg-blue-50 text-blue-500' : inq.status === 'reviewed' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                                            {inq.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    {inq.status === "finished" ? (
                                        <div className="px-5 py-3 bg-blue-50 text-blue-500 rounded-2xl flex items-center gap-2 opacity-80 border border-blue-100">
                                            <Check size={16} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Completed</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleNextStage(inq)} className={`px-5 py-3 rounded-2xl transition-all flex items-center gap-2 border ${inq.status === 'reviewed' ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-100' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-500'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{inq.status === 'reviewed' ? 'Finish' : 'Review'}</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                    
                                    <button onClick={() => { if(confirm("Are you sure you want to delete this record?")) deleteDoc(doc(db, "inquiries", inq.id)) }} className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* --- DIALOG MODAL --- */}
            <AnimatePresence>
                {selectedInquiry && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedInquiry(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm text-indigo-500 border border-slate-50">
                                        <User size={30} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{selectedInquiry.customerDetails?.firstName} {selectedInquiry.customerDetails?.lastName}</h3>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${selectedInquiry.status === 'finished' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {selectedInquiry.status}
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-2">
                                                <Clock size={12} /> {selectedInquiry.createdAt?.toDate().toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedInquiry(null)} className="p-2.5 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
                                {/* Grid Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Mail size={12}/> Contact Information</label>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">{selectedInquiry.customerDetails?.email}</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedInquiry.customerDetails?.phone || "No phone provided"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 border-l border-slate-100 pl-0 md:pl-8">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={12}/> Shipping Address</label>
                                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                            {selectedInquiry.customerDetails?.streetAddress}
                                            <span className="block text-slate-400 mt-1">{selectedInquiry.customerDetails?.apartment}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Customer Comment */}
                                <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare size={16} className="text-amber-600" />
                                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Customer Notes</span>
                                    </div>
                                    <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                                        "{selectedInquiry.customerDetails?.orderNotes || "No specific instructions provided by the customer."}"
                                    </p>
                                </div>

                                {/* Items */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Package size={14} /> Item Summary
                                    </label>
                                    <div className="grid gap-3">
                                        {selectedInquiry.items?.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                                                        <SmartImage src={item.image} className="w-10 h-10 object-contain p-1" alt="" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-black text-slate-800 uppercase block">{item.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400">SKU: {item.sku}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs">
                                                    QTY {item.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-4">
                                <div>
                                    {selectedInquiry.status === "finished" && (
                                        <button 
                                            onClick={() => handleUndo(selectedInquiry.id)} 
                                            className="px-5 py-3 text-amber-600 hover:bg-amber-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 border border-amber-200"
                                        >
                                            <RotateCcw size={16} /> Undo Status
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setSelectedInquiry(null)}
                                        className="px-6 py-3 bg-white text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-slate-100 transition-all"
                                    >
                                        Close
                                    </button>
                                    
                                    {selectedInquiry.status !== "finished" && (
                                        <button 
                                            onClick={() => handleNextStage(selectedInquiry)} 
                                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> 
                                            {selectedInquiry.status === 'reviewed' ? 'Confirm Finish' : 'Mark Reviewed'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}