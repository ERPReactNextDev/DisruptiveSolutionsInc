"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import type { LatLngTuple } from "leaflet";

// Lucide Icons
import {
    Mail, Phone, MapPin, Send, Facebook, Instagram, Linkedin,
    Upload, Loader2, Share2, ChevronLeft
} from "lucide-react";

// Firebase Imports
import { db, auth, storage } from "@/lib/firebase";
import {
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Components
import Navbar from "../components/navigation/navbar";
import Footer from "../components/navigation/footer";
import FloatingMenuWidget from "../components/menu-widget";

// Dynamic Import para sa Map
const Map = dynamic(() => import("@/components/ui/map").then(mod => mod.Map), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse rounded-[40px] flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Loading Map...
        </div>
    )
});
const MapMarker = dynamic(() => import("@/components/ui/map").then(mod => mod.MapMarker), { ssr: false });
const MapPopup = dynamic(() => import("@/components/ui/map").then(mod => mod.MapPopup), { ssr: false });
const MapTileLayer = dynamic(() => import("@/components/ui/map").then(mod => mod.MapTileLayer), { ssr: false });
const MapController = dynamic(() => import("@/components/ui/map").then(mod => mod.MapController), { ssr: false });

// Default view — all Philippines
const DEFAULT_MAP_VIEW = { center: [11.5, 123.0] as LatLngTuple, zoom: 5 };

export default function ContactUsPage() {
    // --- STATES ---
    const [contacts, setContacts] = useState<any[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [userSession, setUserSession] = useState<any>(null);
    const [highlightMap, setHighlightMap] = useState(false);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [mapView, setMapView] = useState<{ center: LatLngTuple; zoom: number }>(DEFAULT_MAP_VIEW);
    const [formData, setFormData] = useState({
        fullName: "",
        company: "",
        email: "",
        phone: "",
        message: ""
    });

    // --- EFFECTS ---

    // 1. Listen to Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserSession(user || null);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Contact Info (Real-time)
    useEffect(() => {
        const q = query(collection(db, "contact_info"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setContacts(data);
            setLoadingContacts(false);
        }, (err) => {
            console.error("Fetch error:", err);
            setLoadingContacts(false);
        });
        return () => unsubscribe();
    }, []);

    // --- DERIVED DATA ---

    // Only addresses that have lat/lng stored in Firestore
    const addressBranches = contacts.filter(
        c => c.type === "address" && c.lat != null && c.lng != null
    );

    const socialItems = contacts.filter(c =>
        ["facebook", "instagram", "linkedin"].includes(c.type.toLowerCase())
    );

    const quickContacts = contacts.filter(c =>
        !["facebook", "instagram", "linkedin"].includes(c.type.toLowerCase())
    );

    // --- HELPERS ---

    const getContactIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "email": return <Mail size={20} />;
            case "phone": return <Phone size={20} />;
            case "address": return <MapPin size={20} />;
            case "facebook": return <Facebook size={20} />;
            case "instagram": return <Instagram size={20} />;
            case "linkedin": return <Linkedin size={20} />;
            default: return <Share2 size={20} />;
        }
    };

    const getClickableLink = (type: string, value: string) => {
        switch (type.toLowerCase()) {
            case "email": return `mailto:${value}`;
            case "phone": return `tel:${value}`;
            case "address": return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
            case "facebook":
            case "instagram":
            case "linkedin":
                return value.startsWith("http") ? value : `https://${value}`;
            default: return "#";
        }
    };

    const flyToAddress = (item: any) => {
        if (item.lat != null && item.lng != null) {
            setActiveBranchId(item.id);
            setMapView({ center: [item.lat, item.lng] as LatLngTuple, zoom: 15 });
            setHighlightMap(true);
            setTimeout(() => setHighlightMap(false), 2000);
            mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const handleContactClick = (item: any) => {
        if (item.type.toLowerCase() === "address") {
            if (item.lat != null && item.lng != null) {
                // Has coords → zoom in on map
                flyToAddress(item);
            } else {
                // No coords → fallback to Google Maps
                window.open(getClickableLink(item.type, item.value), "_blank");
            }
        } else {
            window.open(getClickableLink(item.type, item.value), "_self");
        }
    };

    const handleResetMap = () => {
        setActiveBranchId(null);
        setMapView(DEFAULT_MAP_VIEW);
    };

    // --- FORM SUBMIT ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            let fileUrl = "";

            if (file) {
                const fileRef = ref(storage, `inquiries/${Date.now()}_${file.name}`);
                const uploadResult = await uploadBytes(fileRef, file);
                fileUrl = await getDownloadURL(uploadResult.ref);
            }

            const submissionData = {
                ...formData,
                attachmentUrl: fileUrl,
                source: "Contact Page",
                status: "unread",
                type: "customer",
            };

            // 1. Save to Firestore
            await addDoc(collection(db, "inquiries"), {
                ...submissionData,
                submittedAt: serverTimestamp(),
            });

            // 2. Send email via Resend
            await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });

            setStatus("success");
            setFormData({ fullName: "", company: "", email: "", phone: "", message: "" });
            setFile(null);
            setTimeout(() => setStatus("idle"), 5000);

        } catch (error) {
            console.error("Submit Error:", error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#d11a2a]/10 selection:text-[#d11a2a]">
            <FloatingMenuWidget />
            <Navbar />

            {/* --- HERO SECTION --- */}
            <section className="relative pt-52 pb-40 bg-[#0a0a0a] overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-transparent to-transparent" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <span className="text-[#d11a2a] text-[12px] font-black uppercase tracking-[0.6em] mb-6 block italic">Contact Us</span>
                        <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                            Let's build better,<br />
                            <span className="text-[#d11a2a] italic"> smarter environments together.</span>
                        </h1>
                    </motion.div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
            </section>

            {/* --- CONTACT CONTENT --- */}
            <section className="relative z-20 -mt-12 md:-mt-24 px-4 md:px-6 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* LEFT */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* QUICK CONTACTS CARD */}
                            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-gray-100">
                                <h3 className="text-xl md:text-2xl font-black uppercase mb-8">
                                    Quick <span className="text-[#d11a2a]">Contacts</span>
                                </h3>

                                <div className="space-y-8 mb-10">
                                    {loadingContacts ? (
                                        <div className="flex items-center gap-3 text-gray-400 font-bold uppercase text-[10px]">
                                            <Loader2 size={16} className="animate-spin" /> Fetching latest info...
                                        </div>
                                    ) : (
                                        quickContacts.map((item) => {
                                            const isActive = item.id === activeBranchId;
                                            const isAddress = item.type.toLowerCase() === "address";
                                            const hasCoords = item.lat != null && item.lng != null;

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleContactClick(item)}
                                                    className={`flex gap-4 group cursor-pointer rounded-2xl transition-all duration-200 p-2 -m-2
                                                        ${isActive ? "bg-red-50" : "hover:bg-gray-50"}`}
                                                >
                                                    <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-sm
                                                        ${isActive
                                                            ? "bg-[#d11a2a] text-white"
                                                            : "bg-red-50 text-[#d11a2a] group-hover:bg-[#d11a2a] group-hover:text-white"
                                                        }`}>
                                                        {getContactIcon(item.type)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.type}</p>
                                                        <p className={`font-bold break-words text-sm md:text-base leading-snug whitespace-pre-line transition-colors
                                                            ${isActive ? "text-[#d11a2a]" : "text-gray-900 group-hover:text-[#d11a2a]"}`}>
                                                            {item.value}
                                                        </p>
                                                        {isActive && isAddress && (
                                                            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-white bg-[#d11a2a] px-2 py-0.5 rounded-full">
                                                                Viewing on map
                                                            </span>
                                                        )}
                                                        {isAddress && !hasCoords && (
                                                            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                                                                Opens Google Maps
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Social icons */}
                                <div className="flex flex-wrap gap-3">
                                    {!loadingContacts && socialItems.map((soc) => (
                                        <a
                                            key={soc.id}
                                            href={getClickableLink(soc.type, soc.value)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={soc.type}
                                            className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center transition-all hover:bg-[#d11a2a] hover:text-white text-gray-600"
                                        >
                                            {getContactIcon(soc.type)}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* MAP */}
                            <div
                                ref={mapRef}
                                className={`h-[350px] rounded-[40px] overflow-hidden shadow-2xl relative transition-all duration-500 ${
                                    highlightMap
                                        ? 'border-8 border-[#d11a2a] scale-[1.02]'
                                        : 'border-8 border-white'
                                }`}
                            >
                                <Map center={mapView.center} zoom={mapView.zoom}>
                                    <MapTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                    <MapController center={mapView.center} zoom={mapView.zoom} />

                                    {/* Dynamic markers — pulled from Firestore, only addresses with coords */}
                                    {addressBranches.map((branch) => (
                                        <MapMarker
                                            key={branch.id}
                                            position={[branch.lat, branch.lng] as LatLngTuple}
                                        >
                                            <MapPopup>
                                                <div className="font-bold">
                                                    <p className="text-xs text-[#d11a2a] uppercase mb-1">
                                                        {branch.label || "Branch"}
                                                    </p>
                                                    <p className="text-[10px]">{branch.value}</p>
                                                </div>
                                            </MapPopup>
                                        </MapMarker>
                                    ))}
                                </Map>

                                {/* Branch count badge */}
                                <div className="absolute top-4 right-4 bg-[#d11a2a] text-white px-4 py-2 rounded-full shadow-lg z-[500]">
                                    <p className="text-xs font-black uppercase tracking-wider">
                                        {addressBranches.length} {addressBranches.length === 1 ? "Branch" : "Branches"}
                                    </p>
                                </div>

                                {/* ← View All — only when zoomed in */}
                                {activeBranchId && (
                                    <div className="absolute top-4 left-4 z-[500]">
                                        <button
                                            onClick={handleResetMap}
                                            className="bg-white/95 backdrop-blur-sm hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-1"
                                        >
                                            <ChevronLeft size={12} /> View All
                                        </button>
                                    </div>
                                )}

                                {/* Open Google Maps */}
                                <div className="absolute bottom-4 left-4 right-4 z-[500]">
                                    <a
                                        href="https://www.google.com/maps/search/?api=1&query=Disruptive+Solutions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-white/95 backdrop-blur-sm hover:bg-[#d11a2a] hover:text-white text-gray-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-center transition-all shadow-lg"
                                    >
                                        Open in Google Maps
                                    </a>
                                </div>
                            </div>

                            {/* Branch Quick-Select Tabs — only visible if there are branches with coords */}
                            {addressBranches.length > 0 && (
                                <div className="bg-white p-4 rounded-[24px] shadow-lg border border-gray-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                                        Jump to Branch
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {addressBranches.map((branch) => (
                                            <button
                                                key={branch.id}
                                                onClick={() => flyToAddress(branch)}
                                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-left leading-tight
                                                    ${activeBranchId === branch.id
                                                        ? "bg-[#d11a2a] text-white shadow-md"
                                                        : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-[#d11a2a]"
                                                    }`}
                                            >
                                                {/* Use label if stored, otherwise first part of address */}
                                                {branch.label || branch.value.split(",")[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: INQUIRY FORM */}
                        <div className="lg:col-span-8 bg-white p-8 md:p-16 rounded-[50px] shadow-2xl border border-gray-50">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Full Name</label>
                                    <input
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        type="text"
                                        placeholder="e.g. Juan Dela Cruz"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">
                                        Company / Organization <span className="text-gray-300 normal-case font-bold tracking-normal"></span>
                                    </label>
                                    <input
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        type="text"
                                        placeholder="e.g. Acme Corporation"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Email</label>
                                    <input
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        type="email"
                                        placeholder="juan@company.com"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Phone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        type="tel"
                                        placeholder="+63 900 000 0000"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Message</label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={5}
                                        placeholder="Tell us about your project..."
                                        className="w-full bg-gray-50 border-none rounded-[32px] px-6 py-4 focus:ring-2 focus:ring-[#d11a2a]/20 outline-none transition-all font-bold resize-none"
                                    />
                                </div>

                                {/* FILE UPLOAD */}
                                <div className="md:col-span-2">
                                    <div
                                        onClick={() => !file && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center cursor-pointer transition-all ${
                                            file ? 'border-[#d11a2a] bg-red-50' : 'border-gray-200 hover:border-[#d11a2a]'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/png, image/jpeg, image/jpg, application/pdf"
                                            onChange={(e) => {
                                                const selectedFile = e.target.files?.[0];
                                                if (selectedFile) {
                                                    if (selectedFile.size > 5 * 1024 * 1024) {
                                                        alert("File is too large! Maximum size is 5MB.");
                                                        e.target.value = "";
                                                        return;
                                                    }
                                                    setFile(selectedFile);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <Upload size={24} className={file ? "text-[#d11a2a] mb-2" : "text-gray-300 mb-2"} />
                                        <p className="text-xs font-black uppercase text-gray-900 tracking-widest text-center">
                                            {file ? file.name : "Attach Project Plans (PNG, PDF, JPG)"}
                                        </p>
                                        {!file && (
                                            <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold">Max size: 5MB • No videos allowed</p>
                                        )}
                                        {file && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="mt-3 text-[10px] text-red-600 font-black uppercase hover:underline"
                                            >
                                                Remove File
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <motion.button
                                        disabled={status === "loading"}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl flex items-center justify-center gap-4 transition-all
                                            ${status === "success" ? "bg-green-600" : status === "error" ? "bg-black" : "bg-[#d11a2a]"} text-white`}
                                    >
                                        {status === "loading" ? <Loader2 className="animate-spin" size={16} /> : status === "success" ? "Sent Successfully" : "Send Inquiry"}
                                        <Send size={16} />
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}