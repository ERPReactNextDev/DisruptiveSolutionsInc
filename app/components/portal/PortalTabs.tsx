"use client";

import React from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { motion } from "framer-motion";
import { FileText, Package, Calendar, MapPin, Activity, Clock, Key, ChevronRight } from "lucide-react";

// --- OVERVIEW TAB ---
export const OverviewTab = ({ userData, date, time }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
    <div>
      <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
        Welcome Back, <br/><span className="text-[#d11a2a]">{userData?.fullName?.split(' ')[0]}</span>
      </h1>
      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-white font-mono bg-white/5 px-2 py-1 rounded">
          <Clock size={12} className="text-[#d11a2a]" />
          <span>{time}</span>
        </div>
        <span className="text-gray-300 uppercase tracking-widest">{date}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white/5 border border-white/10 p-6 rounded-[32px]">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">System Status</p>
        <div className="text-2xl font-black mt-4 uppercase italic">Authorized</div>
        <p className="mt-2 text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={10} /> Live Sync Active
        </p>
      </div>
    </div>
  </motion.div>
);

// --- QUOTATIONS TAB (Showing Inquiries) ---
export const QuotesTab = ({ quotes, loading }: { quotes: any[], loading: boolean }) => {
  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-[#d11a2a] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Fetching Inquiries...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#d11a2a]">My Inquiries</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">History of requested products</p>
        </div>
      </div>
       
      {quotes.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[48px] border border-dashed border-white/10">
          <Package size={48} className="mx-auto text-gray-800 mb-4" />
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-400">No Inquiries Found</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {quotes.map((inquiry) => (
            <div key={inquiry.id} className="bg-white/5 border border-white/10 p-8 rounded-[40px] group hover:border-[#d11a2a]/40 transition-all">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                  <div className={`text-[8px] font-black uppercase px-3 py-1 rounded-full inline-block mb-3 tracking-widest ${
                    inquiry.status === 'pending' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                  }`}>
                    {inquiry.status || 'Pending Review'}
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">
                    REF: <span className="text-gray-500">#{inquiry.id.slice(-6).toUpperCase()}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2 justify-end">
                    <Calendar size={12}/> {inquiry.createdAt?.toDate().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Package size={14} className="text-[#d11a2a]"/> Requested Items ({inquiry.items?.length})
                  </p>
                  <div className="flex -space-x-3 overflow-hidden">
                    {inquiry.items?.map((item: any, idx: number) => (
                      <div key={idx} className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-[#0a0a0a] relative group/img">
                        <SmartImage src={item.image} alt="" className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex md:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Shipping To</p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase truncate max-w-[200px]">
                      {inquiry.customerDetails?.streetAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d11a2a] group-hover:gap-4 transition-all">
                  View Order Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// --- SETTINGS TAB ---
export const SettingsTab = ({ handlePassUpdate, newPass, setNewPass, status }: any) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
    <h2 className="text-2xl font-black uppercase italic text-[#d11a2a] mb-8">Security Configuration</h2>
    <form onSubmit={handlePassUpdate} className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6">
      <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Update Password</label>
        <div className="relative">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="password" 
            required 
            value={newPass} 
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-[#d11a2a]"
            placeholder="••••••••"
          />
        </div>
      </div>
      <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d11a2a] hover:text-white transition-all">
        Sync New Credentials
      </button>
      {status.message && (
        <p className={`text-center text-[9px] font-black uppercase p-3 rounded-xl ${status.error ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
          {status.message}
        </p>
      )}
    </form>
  </motion.div>
);