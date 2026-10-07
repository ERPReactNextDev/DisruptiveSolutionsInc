"use client";

import React from "react"

import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, X, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// FIREBASE & CLOUDINARY IMPORTS
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ChatMessage {
  id: string;
  message?: string;
  imageUrl?: string;
  senderEmail: string;
  senderName: string;
  isAdmin: boolean;
  website: string;
  timestamp: any;
}

export default function FloatingChatWidget({ 
  embedded = false, 
  onClose 
}: { 
  embedded?: boolean;
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showFaqMenu, setShowFaqMenu] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dynamicFaqs, setDynamicFaqs] = useState<any[]>([]);
  
  // Load User Session (Priority: Admin > User > Guest)
  useEffect(() => {
    const adminData = localStorage.getItem("disruptive_admin_user");
    const sessionData = localStorage.getItem("disruptive_user_session");

    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        setCurrentUser({
          displayName: admin.name || "Admin Support",
          email: admin.email,
          website: "disruptivesolutionsinc",
          isAdmin: true
        });
      } catch (err) {
        console.error("Admin session error:", err);
      }
    } else if (sessionData) {
      try {
        const userData = JSON.parse(sessionData);
        setCurrentUser(userData);
      } catch (err) {
        console.error("Session parse error:", err);
        createUniqueGuest();
      }
    } else {
      createUniqueGuest();
    }
  }, []);

  // Function to generate a unique ID for guests
  const createUniqueGuest = () => {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const guestEmail = `guest_${uniqueId}@disruptive.inc`;
    
    const guestUser = {
      displayName: `Guest #${uniqueId.toUpperCase()}`,
      email: guestEmail,
      website: "disruptivesolutionsinc",
      isGuest: true
    };

    localStorage.setItem("disruptive_user_session", JSON.stringify(guestUser));
    setCurrentUser(guestUser);
  };

  useEffect(() => {
    const q = query(collection(db, "faq_settings"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDynamicFaqs(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // Firestore Realtime Listener
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("website", "==", "disruptivesolutionsinc"),
      where("senderEmail", "==", currentUser.email),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];

      if (!isOpen && dbMessages.length > messages.length) {
        if (dbMessages[dbMessages.length - 1].isAdmin) {
          setUnreadCount(prev => prev + 1);
        }
      }

      setMessages(dbMessages);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsubscribe();
  }, [isOpen, currentUser, messages.length]);

  // Handle Delete Message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, "chats", messageId));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  // Handle Edit Message
  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    try {
      await updateDoc(doc(db, "chats", messageId), {
        message: editingText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessageId(null);
      setEditingText("");
    } catch (err) {
      console.error("Edit Error:", err);
    }
  };

  // Handle Send Message & Auto Reply for FAQ
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string, autoReply?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || message;
    if (!textToSend.trim() || !currentUser) return;

    try {
      if (!customMsg) setMessage("");

      // 1. User Message
      await addDoc(collection(db, "chats"), {
        senderEmail: currentUser.email,
        senderName: currentUser.displayName,
        message: textToSend,
        isAdmin: false,
        timestamp: serverTimestamp(),
        website: "disruptivesolutionsinc"
      });

      // 2. Auto Reply Logic
      if (autoReply) {
        setTimeout(async () => {
          await addDoc(collection(db, "chats"), {
            senderEmail: currentUser.email,
            senderName: "Support Bot",
            message: autoReply,
            isAdmin: true,
            timestamp: serverTimestamp(),
            website: "disruptivesolutionsinc"
          });
        }, 800);
      }
    } catch (err) { console.error("Send Error:", err); }
  };

  // Cloudinary Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      setIsUploading(true);
      const secureUrl = await uploadToCloudinary(file);

      await addDoc(collection(db, "chats"), {
        senderEmail: currentUser.email,
        senderName: currentUser.displayName,
        imageUrl: secureUrl,
        isAdmin: false,
        timestamp: serverTimestamp(),
        website: "disruptivesolutionsinc"
      });
    } catch (err) { console.error("Upload Error:", err); } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn(
      "antialiased font-sans",
      embedded ? "" : "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
    )}>
      <AnimatePresence>
        {(embedded || isOpen) && (
          <motion.div
            initial={embedded ? {} : { opacity: 0, y: 15, scale: 0.95 }}
            animate={embedded ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={embedded ? {} : { opacity: 0, y: 15, scale: 0.95 }}
            className="w-[340px] md:w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="border-b border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 border-none ring-0 overflow-hidden">
                  <AvatarImage 
                    src="/images/icon.png" 
                    className="object-cover w-full h-full" 
                    alt="Support Avatar"
                  />
                  <AvatarFallback className="bg-[#222] text-white text-[10px]">
                    DS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-[13px] font-bold text-white tracking-tight">DSI-CS</h3>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-white/40 uppercase font-medium">Online</span>
                  </div>
                </div>
              </div>

              {/* FAQ Toggle Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowFaqMenu(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider
               rounded-full border border-white/10 bg-white/5 text-white/50
               hover:bg-white/10 hover:text-white transition"
                >
                  {showFaqMenu ? (
                    <>
                      <X className="h-3 w-3" />
                      Hide FAQs
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-[#d11a2a]" />
                      Show FAQs
                    </>
                  )}
                </button>
              </div>

              {/* Close Button - works for both embedded and standalone */}
              <button 
                onClick={() => {
                  if (embedded && onClose) {
                    onClose();
                  } else {
                    setIsOpen(false);
                  }
                }} 
                className="p-1.5 text-white/40 hover:text-white transition opacity-60 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="relative flex h-[380px] flex-col bg-[#050505]">

              {/* FAQ Section - Solid Background & Sticky */}
              <AnimatePresence>
                {showFaqMenu && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="absolute top-0 left-0 w-full z-20 bg-[#0a0a0a] border-b border-white/5 p-4 space-y-2 shadow-xl"
                  >
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Quick Answers</p>
                    {dynamicFaqs.map((faq, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleSendMessage(undefined, faq.question, faq.answer);
                          setShowFaqMenu(false);
                        }}
                        className="w-full text-left p-2 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center gap-2 group active:scale-[0.98]"
                      >
                        <span className="flex-shrink-0 bg-white/5 w-6 h-6 flex items-center justify-center rounded-md text-[12px] group-hover:bg-[#d11a2a]/20 transition-colors">
                          {faq.icon}
                        </span>
                        <span className="flex-1 text-[11px] text-white font-medium leading-tight truncate">
                          {faq.question}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages List */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pt-4">
                {messages.length === 0 && !showFaqMenu && (
                  <div className="text-center py-10 opacity-20">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-white" />
                    <p className="text-xs text-white">No messages yet. Ask a question!</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.isAdmin ? "justify-start" : "justify-end")}
                    onMouseEnter={() => !msg.isAdmin && setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className={cn("max-w-[85%] flex flex-col gap-1 group", !msg.isAdmin && "items-end")}>
                      <div className={cn("rounded-xl px-3 py-2 text-[12px] border shadow-sm relative",
                        msg.isAdmin ? "bg-white/10 border-white/5 text-white rounded-tl-none" : "bg-[#d11a2a] border-transparent text-white rounded-tr-none")}>

                        {msg.imageUrl && (
                          <SmartImage
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="rounded-lg mb-1.5 max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                        )}

                        {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                      </div>
                      <span className="text-[8px] text-white/20 font-medium px-1 uppercase">
                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Just now"}
                      </span>
                    </div>
                  </div>
                ))}

                {isUploading && (
                  <div className="flex justify-end pr-2 italic text-[10px] text-white/40 animate-pulse items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                  </div>
                )}
              </div>
            </div>

            {/* Input Footer */}
            <div className="border-t border-white/5 bg-[#0a0a0a] p-3">
              <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-white/40 hover:text-white transition-colors disabled:opacity-30"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#d11a2a]/50 transition-all"
                />
                <Button
                  size="icon"
                  type="submit"
                  disabled={!message.trim() || isUploading}
                  className="h-8 w-8 rounded-lg bg-[#d11a2a] hover:bg-[#b01622] transition-all active:scale-90"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button - HIDE kung embedded */}
      {!embedded && (
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 border",
              isOpen ? "bg-[#0a0a0a] text-white border-white/10" : "bg-white text-black border-neutral-200"
            )}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </motion.button>

          {!isOpen && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#d11a2a] text-[10px] font-bold text-white ring-4 ring-white dark:ring-[#0a0a0a] shadow-lg"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
}