"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    ChevronRight,
    Clock,
    ExternalLink,
    Lock,
    Eye,
    EyeOff,
    Menu,
    X,
    User,
    Home,
    CheckCircle2
} from "lucide-react";

// FIREBASE IMPORTS
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";

// COMPONENT IMPORT
import QuotationModal from "../components/portal/QuotationModal";
import FloatingChatWidget from "../components/chat-widget";
import FloatingMenuWidget from "../components/menu-widget";

export default function PortalPage() {
    // --- UI STATES ---
    const [activeTab, setActiveTab] = useState("quotes");
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

    // --- DATA STATES ---
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [inquiriesLoading, setInquiriesLoading] = useState(false);
    const [email, setEmail] = useState("");

    // --- SECURITY STATES ---
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState({ loading: false, message: "", error: false });

    const router = useRouter();

    // System Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // Fetch Inquiries
    const fetchInquiriesByEmail = async (targetEmail: string) => {
        setInquiriesLoading(true);
        try {
            const q = query(
                collection(db, "inquiries"),
                where("customerDetails.email", "==", targetEmail),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            setInquiries(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err: any) {
            console.error("Fetch Error:", err.message);
        } finally {
            setInquiriesLoading(false);
        }
    };

    // Sync state kapag nag-update sa modal
    const handleUpdateInquiry = (id: string, newStatus: string) => {
        setInquiries((prev) => prev.map(inq => 
            inq.id === id ? { ...inq, status: newStatus } : inq
        ));
    };

    useEffect(() => {
        const sessionData = localStorage.getItem("disruptive_user_session");
        let targetEmail = "";

        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                targetEmail = parsed.email;
            } catch (e) { console.error(e); }
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setEmail(targetEmail || user.email || "");
                const docSnap = await getDoc(doc(db, "users", user.uid));
                setUserData(docSnap.exists() ? docSnap.data() : { fullName: user.displayName || "User" });
                if (targetEmail || user.email) fetchInquiriesByEmail(targetEmail || user.email || "");
                setLoading(false);
            } else {
                router.push("/auth");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setUpdatingStatus({ loading: false, message: "Password must be at least 6 characters.", error: true });
            return;
        }
        setUpdatingStatus({ loading: true, message: "", error: false });
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                setUpdatingStatus({ loading: false, message: "Password updated successfully!", error: false });
                setNewPassword("");
            }
        } catch (err: any) {
            setUpdatingStatus({ loading: false, message: "Security measure: Please re-login.", error: true });
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("disruptive_user_session");
            router.push("/auth");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    if (loading) return (
        <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d11a2a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Syncing System...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans overflow-hidden relative">
            
            {/* MOBILE OVERLAY */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[65] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className={`
                fixed lg:relative z-[70] h-screen transition-all duration-500 ease-in-out border-r border-white/5 bg-[#0a0a0a] flex flex-col
                ${isSidebarOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0 w-72"}
                lg:translate-x-0
            `}>
                <div className="p-8 flex items-center justify-between">
                    <h2 className="font-black italic tracking-tighter text-xl text-white uppercase">
                        Disruptive <span className="text-[#d11a2a]">OS</span>
                    </h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-gray-400 hover:bg-white/5 hover:text-white mb-6 border border-white/5 group"
                    >
                        <Home size={20} className="group-hover:text-[#d11a2a] transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Main</span>
                    </button>

                    <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => {setActiveTab("overview"); setSidebarOpen(false);}} />
                    <NavItem icon={FileText} label="Quotations" active={activeTab === "quotes"} onClick={() => {setActiveTab("quotes"); setSidebarOpen(false);}} />
                    <NavItem icon={Settings} label="Security" active={activeTab === "settings"} onClick={() => {setActiveTab("settings"); setSidebarOpen(false);}} />
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-4 text-gray-500 hover:text-[#d11a2a] w-full p-4 transition-colors">
                        <LogOut size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-left">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-[#0a0a0a]/40 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 bg-[#d11a2a]/10 border border-[#d11a2a]/20 rounded-xl text-[#d11a2a] active:scale-95 transition-all">
                            <Menu size={24}/>
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span className="hidden sm:inline">Portal</span> <ChevronRight size={14} className="hidden sm:inline" /> <span className="text-white">{activeTab}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Time</p>
                            <p className="text-[10px] font-mono text-[#d11a2a]">{formattedTime}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#d11a2a]/10 border border-[#d11a2a]/20 flex items-center justify-center">
                            <User size={18} className="text-[#d11a2a]" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "overview" && (
                            <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 lg:space-y-8">
                                <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter italic">
                                    Welcome, <span className="text-[#d11a2a]">{userData?.fullName?.split(' ')[0]}</span>
                                </h1>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                    <StatCard label="Account Email" value={email} trend="Verified" />
                                    <StatCard label="My Requests" value={inquiries.length} trend="Total Records" />
                                    <StatCard label="Access Level" value="Authorized" trend="Standard Client" />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "quotes" && (
    <motion.div 
        key="qt" 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -10 }} 
        className="space-y-6"
    >
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[#d11a2a]">
                Quotation History
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {inquiries.length} Total Records
            </p>
        </div>

        {inquiriesLoading ? (
            <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#d11a2a] border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loading History...</p>
            </div>
        ) : inquiries.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10 text-gray-500 uppercase text-[10px] font-black">
                No Records Found
            </div>
        ) : (
            <div className="grid gap-4">
                {inquiries.map((inq) => (
                    <div 
                        key={inq.id} 
                        onClick={() => setSelectedInquiry(inq)}
                        className="bg-white/5 border border-white/10 p-5 lg:p-8 rounded-[32px] group cursor-pointer hover:bg-white/[0.08] hover:border-[#d11a2a]/30 transition-all relative overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                        inq.status === "finished" || inq.status === "reviewed" 
                                        ? "bg-green-600 text-white" 
                                        : "bg-[#d11a2a] text-white"
                                    }`}>
                                        {inq.status || "Pending"}
                                    </span>
                                    
                                    {/* INDICATOR IF FEEDBACK IS ALREADY SENT */}
                                    {inq.hasFeedback && (
                                        <span className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Feedback Sent
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                                        Ref: #{inq.id.slice(-6).toUpperCase()}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                        Items: {inq.items?.map((item: any) => item.name).join(", ")}
                                    </p>
                                </div>

                                <div className="flex -space-x-3">
                                    {inq.items?.map((item: any, i: number) => (
                                        <div key={i} className="relative group/img">
                                            <SmartImage 
                                                src={item.image} 
                                                className="w-12 h-12 rounded-xl bg-white p-1.5 border-2 border-[#1a1a1a] object-contain shadow-2xl transition-transform group-hover/img:scale-110" 
                                                alt="product" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:text-right flex flex-row md:flex-col justify-between items-end gap-2 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date Submitted</p>
                                    <p className="text-sm font-black text-white">{inq.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                
                                <button className="text-[10px] font-black uppercase text-[#d11a2a] flex items-center gap-2 group-hover:gap-4 transition-all bg-[#d11a2a]/5 px-4 py-2 rounded-full hover:bg-[#d11a2a]/10">
                                    View Full Details <ExternalLink size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </motion.div>
)}

                        {activeTab === "settings" && (
                            <motion.div key="st" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-xl mx-auto lg:mx-0 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic text-[#d11a2a]">Security Settings</h2>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Manage your account access</p>
                                </div>
                                <form onSubmit={handleUpdatePassword} className="bg-white/5 border border-white/10 p-6 lg:p-10 rounded-[40px] space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <Lock size={12}/> New Security Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="MINIMUM 6 CHARACTERS"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[#d11a2a] transition-all text-white"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={updatingStatus.loading} className="w-full bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all disabled:opacity-50">
                                        {updatingStatus.loading ? "Updating System..." : "Save New Password"}
                                    </button>
                                    {updatingStatus.message && (
                                        <p className={`text-[9px] font-black uppercase text-center p-4 rounded-xl ${updatingStatus.error ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                            {updatingStatus.message}
                                        </p>
                                    )}
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <FloatingMenuWidget/>
            </main>

            {/* QUOTATION MODAL COMPONENT */}
            <QuotationModal 
                isOpen={!!selectedInquiry}
                onClose={() => setSelectedInquiry(null)}
                inquiry={selectedInquiry}
                userData={userData}
                email={email}
                onUpdate={handleUpdateInquiry}
            />

        </div>
    );
}

// --- REUSABLE COMPONENTS ---

function NavItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group ${
                active ? "bg-[#d11a2a] text-white" : "text-gray-500 hover:bg-white/5 hover:text-white"
            }`}
        >
            <Icon size={20} className="shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-left">{label}</span>
            {active && (
                <motion.div layoutId="navIndicator" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
            )}
        </button>
    );
}

function StatCard({ label, value, trend }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] group relative overflow-hidden">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">{label}</p>
            <div className="text-lg lg:text-xl font-black tracking-tighter truncate text-white">{value}</div>
            <div className="mt-2 text-[9px] font-bold text-[#d11a2a] uppercase flex items-center gap-2">
                <Clock size={10} /> {trend}
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#d11a2a]/5 blur-3xl rounded-full" />
        </div>
    );
}