"use client";

import React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Circle,
  MessageSquare,
  Trash2,
  ImageIcon,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  Edit2,
  Check,
  X as XIcon
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// FIREBASE & CLOUDINARY IMPORTS
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = {
  id: string;
  sender: "user" | "contact";
  author: string;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  isAdmin: boolean;
};

type Conversation = {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline";
  initials: string;
  messages: Message[];
  quickReplies: string[];
  hasUnread: boolean;
};

export function Messenger() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminSession, setAdminSession] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = localStorage.getItem("disruptive_admin_user");
    if (session) setAdminSession(JSON.parse(session));
  }, []);

  // Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("website", "==", "disruptivesolutionsinc"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grouped: Record<string, Conversation> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const clientEmail = data.senderEmail;

        if (!grouped[clientEmail]) {
          grouped[clientEmail] = {
            id: clientEmail,
            email: clientEmail,
            name: data.senderName || "Guest Client",
            status: "online",
            initials: (data.senderName || "G").substring(0, 2).toUpperCase(),
            messages: [],
            quickReplies: ["I'll check on this.", "Copy that."],
            hasUnread: false
          };
        }

        const msgIsAdmin = data.isAdmin || false;
        grouped[clientEmail].messages.push({
          id: doc.id,
          sender: msgIsAdmin ? "user" : "contact",
          author: data.senderName,
          text: data.message,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "...",
          isAdmin: msgIsAdmin
        });

        const lastMsg = grouped[clientEmail].messages[grouped[clientEmail].messages.length - 1];
        grouped[clientEmail].hasUnread = !lastMsg.isAdmin;
      });

      const convList = Object.values(grouped);
      setConversations(convList);

      if (!selectedConversationId && convList.length > 0) {
        setSelectedConversationId(convList[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedConversationId]);

  // Get active conversation (must be declared before the useEffect that uses it)
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  // Handle Text Reply
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !selectedConversationId || !adminSession) return;

    try {
      await addDoc(collection(db, "chats"), {
        senderEmail: selectedConversationId,
        senderName: adminSession.displayName || "Admin",
        message: draft.trim(),
        isAdmin: true,
        timestamp: serverTimestamp(),
        website: "disruptivesolutionsinc"
      });
      setDraft("");
    } catch (err) { console.error(err); }
  };

  // Handle Image Upload for Admin
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversationId || !adminSession) return;

    try {
      setIsUploading(true);
      const secureUrl = await uploadToCloudinary(file);
      await addDoc(collection(db, "chats"), {
        senderEmail: selectedConversationId,
        senderName: adminSession.displayName || "Admin",
        imageUrl: secureUrl,
        isAdmin: true,
        timestamp: serverTimestamp(),
        website: "disruptivesolutionsinc"
      });
    } catch (err) { console.error("Upload Error:", err); } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle conversation selection (mobile)
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setShowChat(true); // Show chat view on mobile
  };

  // Handle back button (mobile)
  const handleBack = () => {
    setShowChat(false);
  };

  return (
    <section className="w-full h-[calc(96vh-120px)] flex gap-6 p-4 lg:p-0">
      {/* SIDEBAR - Hidden on mobile when chat is open */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col bg-card border rounded-2xl overflow-hidden shadow-sm",
        "lg:flex", // Always show on desktop
        showChat ? "hidden" : "flex" // Toggle on mobile
      )}>
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg tracking-tight">Messages</h2>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">
              <Circle className="w-2 h-2 fill-current mr-1.5 animate-pulse" /> Live
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 bg-muted/50 border-none rounded-xl focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 text-left relative",
                selectedConversationId === conv.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
              )}
            >
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarFallback className={cn(selectedConversationId === conv.id ? "bg-white/20" : "bg-primary/10 text-primary font-bold")}>
                  {conv.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{conv.name}</p>
                <p className={cn("text-xs truncate opacity-70", selectedConversationId === conv.id ? "text-white" : "text-muted-foreground")}>
                  {conv.messages[conv.messages.length - 1]?.imageUrl ? "📷 Sent an image" : conv.messages[conv.messages.length - 1]?.text}
                </p>
              </div>
              {conv.hasUnread && selectedConversationId !== conv.id && (
                <span className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW - Show on mobile when conversation selected */}
      <div className={cn(
        "flex-1 flex-col bg-card border rounded-2xl overflow-hidden shadow-sm relative",
        "lg:flex", // Always show on desktop
        showChat ? "flex" : "hidden lg:flex" // Toggle on mobile
      )}>
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div key={activeConversation.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {/* Header with Back Button for Mobile */}
              <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {/* Back button - only visible on mobile */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden rounded-full -ml-2"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {activeConversation.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold">{activeConversation.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{activeConversation.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 bg-muted/20 scrollbar-hide">
                {activeConversation.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
                    onMouseEnter={() => msg.isAdmin && setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className={cn("flex flex-col max-w-[85%] lg:max-w-[60%] group", msg.sender === "user" ? "items-end" : "items-start")}>
                      {editingMessageId === msg.id ? (
                        <div className="w-full flex gap-2 items-end mb-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border-2 border-primary bg-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleEditMessage(msg.id)}
                            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingMessageId(null); setEditingText(""); }}
                            className="p-1.5 bg-slate-300 hover:bg-slate-400 text-white rounded-lg transition"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={cn("px-3 lg:px-4 py-2.5 rounded-2xl text-sm shadow-sm relative", msg.sender === "user" ? "bg-primary text-white rounded-tr-none" : "bg-background border rounded-tl-none")}>
                            {msg.imageUrl && (
                              <SmartImage 
                                src={msg.imageUrl || "/placeholder.svg"} 
                                alt="Chat image" 
                                className="rounded-lg mb-2 max-w-full cursor-zoom-in hover:brightness-105 transition"
                                onClick={() => window.open(msg.imageUrl, '_blank')}
                              />
                            )}
                            {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                            
                            {/* Edit/Delete Menu - Only for Admin Messages */}
                            {msg.isAdmin && (
                              <div className={cn(
                                "absolute -top-2 -right-2 flex gap-1 bg-white rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity",
                                hoveredMessageId === msg.id ? "opacity-100" : ""
                              )}>
                                <button
                                  onClick={() => { setEditingMessageId(msg.id); setEditingText(msg.text || ""); }}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">{msg.timestamp}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isUploading && (
                  <div className="flex justify-end pr-2 text-[10px] text-muted-foreground animate-pulse italic">
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> Sending image...
                  </div>
                )}
              </div>

              {/* Input Area - Optimized for Mobile */}
              <div className="p-3 lg:p-4 bg-background border-t">
                <form onSubmit={handleSubmit} className="relative">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <div className="bg-muted/50 rounded-2xl border p-2">
                    <Textarea 
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[60px] lg:min-h-[80px] w-full bg-transparent border-none focus-visible:ring-0 text-sm p-2 lg:p-3 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-muted-foreground hover:text-primary text-xs lg:text-sm"
                      >
                        <ImageIcon className="w-4 h-4 mr-1 lg:mr-2" /> 
                        <span className="hidden sm:inline">{isUploading ? "Uploading..." : "Image"}</span>
                      </Button>
                      <Button type="submit" size="sm" disabled={!draft.trim() && !isUploading} className="rounded-lg h-8 px-3 lg:px-5">
                        <Send className="w-3.5 h-3.5 mr-1 lg:mr-2" /> Reply
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
              <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
              <p className="text-center text-sm lg:text-base">Select a client to view conversation</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
