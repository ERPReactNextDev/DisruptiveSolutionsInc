"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, query, orderBy,
  deleteDoc, doc, addDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import {
  Plus, Pencil, Trash2, Loader2, ImagePlus, X,
  AlignLeft, Layout, Save, FileText, Bold, Italic,
  List, ListOrdered, Heading1, Heading2, Heading3, Link2, Undo, Redo,
  Palette, Type, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';

type Section = {
  id: string;
  type: "paragraph" | "image-detail";
  title?: string;
  description?: string;
  imageUrl?: string;
  imageFile?: File | null;
};

// Rich Text Editor Component with Color & Font
const RichTextEditor = ({ content, onChange, placeholder }: { content: string, onChange: (html: string) => void, placeholder?: string }) => {
  const [mounted, setMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#d11a2a] underline hover:text-black transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[150px] text-gray-700 leading-relaxed',
      },
    },
  });

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const colors = [
    '#000000', '#d11a2a', '#1877F2', '#10B981', 'rgba(210, 140, 42, 1)',
    '#8B5CF6', '#EC4899', '#6B7280', '#FFFFFF'
  ];

  const fonts = [
    { name: 'Default', value: '' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Comic Sans', value: 'Comic Sans MS, cursive' },
    { name: 'Impact', value: 'Impact, fantasy' },
  ];

  if (!mounted || !editor) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-4">
        <div className="min-h-[150px] flex items-center justify-center text-gray-400">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('bold') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('italic') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Heading3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 rounded hover:bg-white transition-colors text-[10px] font-bold ${editor.isActive('paragraph') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          P
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('bulletList') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('orderedList') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {/* Font Family Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontPicker(!showFontPicker);
              setShowColorPicker(false);
            }}
            className="p-2 rounded hover:bg-white transition-colors text-gray-600 flex items-center gap-1"
          >
            <Type size={16} />
          </button>

          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-48 max-h-64 overflow-y-auto">
              {fonts.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                    setShowFontPicker(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowFontPicker(false);
            }}
            className="p-2 rounded hover:bg-white transition-colors text-gray-600"
          >
            <Palette size={16} />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50">
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-[#d11a2a] transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="w-full mt-2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors border-t border-gray-100 pt-2"
              >
                Reset Color
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive('link') ? 'bg-white text-[#d11a2a]' : 'text-gray-600'}`}
        >
          <Link2 size={16} />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-2 rounded hover:bg-white transition-colors text-gray-600 text-xs font-bold"
          >
            Remove Link
          </button>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-white transition-colors text-gray-600 disabled:opacity-30"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-white transition-colors text-gray-600 disabled:opacity-30"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <style jsx global>{`
          .ProseMirror {
            outline: none;
          }
          .ProseMirror h1 {
            font-size: 2em;
            font-weight: 800;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
            line-height: 1.2;
          }
          .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: 700;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            line-height: 1.3;
          }
          .ProseMirror h3 {
            font-size: 1.25em;
            font-weight: 700;
            margin-top: 1em;
            margin-bottom: 1em;
            line-height: 1.4;
          }
          .ProseMirror p {
            margin: 1em 0;
          }
          .ProseMirror strong {
            font-weight: 700;
          }
          .ProseMirror em {
            font-style: italic;
          }
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .ProseMirror li {
            margin: 0.25em 0;
          }
          .ProseMirror a {
            color: #d11a2a;
            text-decoration: underline;
            cursor: pointer;
          }
          .ProseMirror a:hover {
            color: #000;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            color: #d1d5db;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default function BlogManager() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [mainTitle, setMainTitle] = useState("");
  const [category, setCategory] = useState("Industry News");
  const [status, setStatus] = useState("Published");
  const [website, setWebsite] = useState("Disruptive Solutions Inc");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePrev, setMainImagePrev] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // NEW: Website Filter State
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");

  // Logic para sa Pagination with Filter
  const filteredBlogs = websiteFilter === "all" 
    ? blogs 
    : blogs.filter(blog => blog.website === websiteFilter);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

  // SEO Settings State
  const [seoDataState, setSeoData] = useState({
    title: "",
    slug: "",
    description: "",
  });
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [websiteFilter]);

  const addParagraph = () => {
    setSections([...sections, { id: Date.now().toString(), type: "paragraph", description: "" }]);
  };

  const addImageDetail = () => {
    setSections([...sections, { id: Date.now().toString(), type: "image-detail", title: "", description: "", imageUrl: "" }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, data: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainTitle || (!mainImagePrev && !mainImage)) return alert("Headline and Header Image are required.");

    setLoading(true);
    try {
      let finalMainImage = mainImagePrev;
      if (mainImage) {
        finalMainImage = await uploadToCloudinary(mainImage);
      }

      const updatedSections = await Promise.all(sections.map(async (sec) => {
        if (sec.type === "image-detail" && sec.imageFile) {
          const uploadedUrl = await uploadToCloudinary(sec.imageFile);
          return { ...sec, imageUrl: uploadedUrl, imageFile: null };
        }
        return sec;
      }));

      let websiteValue = "disruptivesolutionsinc";
      if (website === "Ecoshift Corporation") websiteValue = "ecoshiftcorporation";
      if (website === "VAH") websiteValue = "VAH";

      const blogData = {
        title: mainTitle,
        category,
        status,
        website: websiteValue,
        coverImage: finalMainImage,
        sections: updatedSections,
        updatedAt: serverTimestamp(),
        slug: mainTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
        seo: {
          title: seoDataState.title || mainTitle,
          slug: seoDataState.slug || mainTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
          description: seoDataState.description || "",
        }
      };

      if (editingId) {
        await updateDoc(doc(db, "blogs", editingId), blogData);
      } else {
        await addDoc(collection(db, "blogs"), { ...blogData, createdAt: serverTimestamp() });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error saving story.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setMainTitle("");
    setMainImagePrev(null);
    setMainImage(null);
    setSections([]);
    setStatus("Published");
    setWebsite("Disruptive Solutions Inc");
    setSeoData({
      title: "",
      slug: "",
      description: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Editorial <span className="text-[#d11a2a]">Suite</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Craft and publish your brand stories</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d11a2a] transition-all shadow-lg shadow-gray-200"
        >
          <Plus size={18} /> New Story
        </button>
      </div>

      {/* WEBSITE FILTER - NEW ADDITION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filter by Website:</span>
          </div>
          <select 
            value={websiteFilter}
            onChange={(e) => setWebsiteFilter(e.target.value)}
            className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:border-[#d11a2a] focus:border-[#d11a2a] focus:ring-0 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Websites</option>
            <option value="disruptivesolutionsinc">Disruptive Solutions Inc</option>
            <option value="ecoshiftcorporation">Ecoshift Corporation</option>
            <option value="VAH">VAH</option>
          </select>
          {websiteFilter !== "all" && (
            <span className="text-[10px] font-bold text-gray-500">
              Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'blog' : 'blogs'}
            </span>
          )}
        </div>
      </div>

     {/* BLOG LIST - MODERN TABLE */}
<div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
  {/* Scrollable wrapper para sa Mobile */}
  <div className="overflow-x-auto">
    <table className="w-full text-left min-w-[800px]">
      <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
        <tr>
          <th className="px-8 py-6">Preview</th>
          <th className="px-8 py-6">Story Details</th>
          <th className="px-8 py-6 text-center">Status</th>
          <th className="px-8 py-6 text-right">Actions</th>
        </tr>
      </thead>
     <tbody className="divide-y divide-gray-50">
  {currentBlogs.map(blog => (
    <tr key={blog.id} className="hover:bg-gray-50/30 transition-colors group">
      {/* PREVIEW IMAGE */}
      <td className="px-8 py-6">
        <div className="w-20 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <SmartImage src={blog.coverImage} className="w-full h-full object-cover" alt="" />
        </div>
      </td>

      {/* STORY DETAILS */}
      <td className="px-8 py-6">
        <h4 className="font-black text-gray-900 uppercase text-sm mb-1 truncate max-w-[300px]">
          {blog.title}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-[#d11a2a] uppercase tracking-widest">{blog.category}</span>
          <span className="text-[8px] font-bold text-gray-300 uppercase">| {blog.website || 'N/A'}</span>
        </div>
      </td>

      {/* STATUS */}
      <td className="px-8 py-6 text-center">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
          blog.status === 'Published' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'
        }`}>
          {blog.status}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setEditingId(blog.id); setMainTitle(blog.title); setCategory(blog.category);
              setStatus(blog.status || "Published"); setMainImagePrev(blog.coverImage);
              setSections(blog.sections || []);
              
              if (blog.website === 'ecoshiftcorporation') setWebsite("Ecoshift Corporation");
              else if (blog.website === 'VAH') setWebsite("VAH");
              else setWebsite("Disruptive Solutions Inc");
              
              setSeoData({
                title: blog.seo?.title || blog.title || "",
                slug: blog.seo?.slug || blog.slug || "",
                description: blog.seo?.description || "",
              });
              setIsModalOpen(true);
            }} 
            className="p-3 bg-gray-50 text-gray-400 hover:bg-black hover:text-white rounded-xl transition-all"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => confirm("Delete this story permanently?") && deleteDoc(doc(db, "blogs", blog.id))} 
            className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
</div>
{/* PAGINATION CONTROLS */}
<div className="flex items-center justify-between px-8 py-6 bg-white border-t border-gray-50 rounded-b-[2.5rem]">
  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
    Page {currentPage} of {totalPages}
  </p>
  
  <div className="flex gap-2">
    <button 
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className={`p-3 rounded-xl transition-all ${
        currentPage === 1 ? 'bg-gray-50 text-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-black hover:text-white'
      }`}
    >
      <ChevronLeft size={16} />
    </button>

    <button 
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
      className={`p-3 rounded-xl transition-all ${
        currentPage === totalPages ? 'bg-gray-50 text-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-black hover:text-white'
      }`}
    >
      <ChevronRight size={16} />
    </button>
  </div>
</div>

      {/* FULL-HEIGHT SIDE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white h-screen w-full max-w-[90rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
            >
              {/* MAIN EDITOR AREA */}
              <div className="flex-1 overflow-y-auto order-2 lg:order-1">
                {/* MODAL HEADER */}
                <div className="p-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-20 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl"><FileText size={24} /></div>
                    <h3 className="font-black uppercase italic tracking-tighter text-2xl">{editingId ? "Edit Story" : "Compose Story"}</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">Discard</button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#d11a2a] flex items-center gap-3 shadow-xl shadow-gray-200 disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Publish Story</>}
                    </button>
                  </div>
                </div>

                {/* EDITOR CONTENT */}
                <div className="p-12 md:p-20 space-y-16 pb-40">
                  {/* HEADLINE SECTION */}
                  <div className="space-y-8">
                    <textarea
                      value={mainTitle}
                      onChange={(e) => setMainTitle(e.target.value)}
                      placeholder="ENTER YOUR HEADLINE..."
                      className="w-full text-6xl font-black uppercase italic outline-none border-none placeholder:text-gray-100 resize-none leading-tight tracking-tighter"
                      rows={2}
                    />

                    <div className="flex flex-wrap gap-10 items-center border-y border-gray-50 py-8">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Category</span>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="font-black text-xs uppercase outline-none bg-transparent cursor-pointer text-gray-900 border-b-2 border-transparent focus:border-[#d11a2a] pb-1 transition-all">
                          <option>Industry News</option><option>Engineering</option><option>Tech Updates</option><option>Case Study</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Visibility</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="font-black text-xs uppercase outline-none bg-transparent cursor-pointer text-gray-900 border-b-2 border-transparent focus:border-[#d11a2a] pb-1 transition-all">
                          <option>Published</option><option>Draft</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Target Website</span>
                        <select
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="font-black text-xs uppercase outline-none bg-transparent cursor-pointer text-gray-900 border-b-2 border-transparent focus:border-[#d11a2a] pb-1 transition-all"
                        >
                          <option>Disruptive Solutions Inc</option>
                          <option>Ecoshift Corporation</option>
                          <option>VAH</option>
                        </select>
                      </div>

                      <label className="ml-auto flex items-center gap-3 cursor-pointer bg-gray-900 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#d11a2a] transition-all shadow-lg">
                        <ImagePlus size={16} /> {mainImagePrev ? "Replace Cover" : "Upload Cover"}
                        <input type="file" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setMainImage(f); setMainImagePrev(URL.createObjectURL(f)); }
                        }} />
                      </label>
                    </div>

                    {mainImagePrev && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl group">
                        <SmartImage src={mainImagePrev} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                      </motion.div>
                    )}
                  </div>

                  {/* DYNAMIC BUILDER */}
                  <div className="space-y-20 relative">
                    {sections.map((section, index) => (
                      <div key={section.id} className="relative group pl-12 border-l-4 border-gray-50 space-y-6">
                        <div className="absolute -left-[18px] top-0 w-8 h-8 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center text-[10px] font-black text-gray-300">
                          {index + 1}
                        </div>

                        <button onClick={() => removeSection(section.id)} className="absolute -right-4 top-0 bg-white border border-gray-100 rounded-full p-2 text-gray-300 hover:text-red-500 hover:border-red-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <X size={14} />
                        </button>

                        {section.type === "paragraph" ? (
                          <RichTextEditor
                            content={section.description || ""}
                            onChange={(html) => updateSection(section.id, { description: html })}
                            placeholder="Continue the story..."
                          />
                        ) : (
                          <div className="space-y-8 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50">
                            <input placeholder="SECTION SUB-HEADER" className="w-full font-black uppercase italic text-lg outline-none border-none tracking-tight bg-transparent" value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
                            <div className="grid md:grid-cols-2 gap-10 items-start">
                              <div className="relative aspect-square bg-white rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-[#d11a2a] transition-all group/img">
                                {section.imageUrl || section.imageFile ? (
                                  <SmartImage src={section.imageFile ? URL.createObjectURL(section.imageFile) : section.imageUrl} className="w-full h-full object-cover" alt="" />
                                ) : <div className="text-center space-y-2 text-gray-300 group-hover/img:text-[#d11a2a]"><ImagePlus className="mx-auto" size={40} /><span className="text-[9px] font-black uppercase tracking-widest block">Insert Image</span></div>}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => updateSection(section.id, { imageFile: e.target.files?.[0] })} />
                              </div>
                              <RichTextEditor
                                content={section.description || ""}
                                onChange={(html) => updateSection(section.id, { description: html })}
                                placeholder="Write a detailed caption or side-story for this image..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* BUILDER TOOLS */}
                  <div className="flex flex-col md:flex-row gap-6 border-t border-gray-50 pt-16">
                    <button onClick={addParagraph} className="flex-1 flex items-center gap-6 p-8 rounded-[2rem] border-2 border-dashed border-gray-100 hover:border-[#d11a2a] hover:bg-red-50/30 transition-all text-gray-300 hover:text-[#d11a2a] group">
                      <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white transition-colors"><AlignLeft size={24} /></div>
                      <div className="text-left">
                        <span className="text-xs font-black uppercase block tracking-widest">Text Block</span>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#d11a2a]">Add a new paragraph</span>
                      </div>
                    </button>
                    <button onClick={addImageDetail} className="flex-1 flex items-center gap-6 p-8 rounded-[2rem] border-2 border-dashed border-gray-100 hover:border-[#d11a2a] hover:bg-red-50/30 transition-all text-gray-300 hover:text-[#d11a2a] group">
                      <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white transition-colors"><Layout size={24} /></div>
                      <div className="text-left">
                        <span className="text-xs font-black uppercase block tracking-widest">Visual Section</span>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#d11a2a]">Add image with description</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* SEO SETTINGS SIDEBAR */}
              <div className="w-full lg:w-[28rem] h-auto lg:h-full bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto p-6 order-1 lg:order-2 max-h-[40vh] lg:max-h-none">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
                    <h4 className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-600"></div> SEO Settings
                    </h4>
                    <p className="text-[10px] text-slate-600">Optimize for search engines</p>
                  </div>

                  {/* SEO Inputs */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-slate-700 font-bold text-xs uppercase tracking-tight">SEO Title</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-700 text-sm font-medium"
                        value={seoDataState.title}
                        onChange={(e) => setSeoData({ ...seoDataState, title: e.target.value })}
                        placeholder={mainTitle || "Blog title for Google"}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-700 font-bold text-xs uppercase tracking-tight flex items-center gap-2">
                        URL Slug
                        <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">No slashes</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-900 font-mono text-sm"
                        value={seoDataState.slug}
                        onChange={(e) => {
                          const sanitizedValue = e.target.value
                            .toLowerCase()
                            .replace(/\//g, "")
                            .replace(/\s+/g, "-");
                          setSeoData({ ...seoDataState, slug: sanitizedValue });
                        }}
                        placeholder={mainTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-') || "e.g., blog-post-title"}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-700 font-bold text-xs uppercase tracking-tight">Meta Description</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-slate-700 text-sm font-medium resize-none"
                        value={seoDataState.description}
                        onChange={(e) => setSeoData({ ...seoDataState, description: e.target.value })}
                        placeholder="Brief summary for search results..."
                      />
                    </div>
                  </div>

                  {/* Google Preview */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400">Google Preview</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('mobile')}
                          className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          Mobile
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('desktop')}
                          className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${previewMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          Desktop
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                          <SmartImage
                            src="/images/icon.png"
                            alt="Site Icon"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-[11px] text-[#202124] font-medium truncate">Disruptive Solutions Inc</p>
                          <p className="text-[10px] text-[#4d5156] truncate">disruptivesolutionsinc.com › blog › {seoDataState.slug || '...'}</p>
                        </div>
                      </div>

                      <div className={`${previewMode === 'mobile' ? 'flex flex-col-reverse gap-2' : 'flex gap-3'}`}>
                        <div className="flex-1 min-w-0">
                          <a
                            href={`https://disruptive-solutions-inc.vercel.app/blog/${seoDataState.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline decoration-[#1a0dab]"
                          >
                            <h3 className="text-[16px] text-[#1a0dab] leading-tight mb-1 line-clamp-2 font-medium">
                              {seoDataState.title || mainTitle || "Enter an SEO Title..."}
                            </h3>
                          </a>
                          <p className="text-[12px] text-[#4d5156] line-clamp-2 leading-relaxed">
                            {seoDataState.description || "Enter a meta description..."}
                          </p>
                        </div>

                        {mainImagePrev && (
                          <div className={`bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 ${previewMode === 'mobile' ? 'w-full h-32' : 'w-24 h-24'}`}>
                            <SmartImage src={mainImagePrev} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}