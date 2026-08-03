"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Loader2, ArrowLeft, Facebook, Instagram, Linkedin, ArrowRight, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function BlogDetailPage() {
    const { slug } = useParams();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const LOGO_WHITE = "/disruptive.png";

      const socials = [
        { icon: Facebook, href: "#", color: "hover:bg-[#1877F2]" },
        { icon: Instagram, href: "#", color: "hover:bg-[#E4405F]" },
        { icon: Linkedin, href: "#", color: "hover:bg-[#0A66C2]" },
      ];

        const footerLinks = [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact Us", href: "/contact-us" },
  ];

useEffect(() => {
    const fetchBlog = async () => {
        if (!slug) return;

        try {
            console.log("Fetching slug for Disruptive:", slug);
            
            // Nagdagdag tayo ng second 'where' clause para sigurado na 
            // disruptive blogs lang ang lalabas sa site na ito.
            const q = query(
                collection(db, "blogs"), 
                where("slug", "==", slug),
                where("website", "==", "disruptivesolutionsinc"), 
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                console.log("Blog data found:", data);
                setBlog(data);
            } else {
                console.log("No matching document found for slug in Disruptive website.");
                setBlog(null);
            }
        } catch (err) {
            console.error("Firestore Error:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchBlog();
}, [slug]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#d11a2a]" /></div>;
    if (!blog) return <div className="h-screen flex items-center justify-center font-bold uppercase tracking-widest">Story Not Found</div>;

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* --- TOP NAVIGATION --- */}
            <nav className="p-6 border-b border-gray-100">
                <div className="max-w-5xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#d11a2a] transition-colors">
                        <ArrowLeft size={14} /> Back to Insights
                    </Link>
                </div>
            </nav>

            <article className="max-w-5xl mx-auto px-6 py-16">
                {/* --- BLOG HEADER --- */}
                <header className="mb-12">

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                    </h1>
                    
                    {/* --- ITO YUNG FIX SA COVER IMAGE --- */}
    {blog.coverImage && (
        <div className="w-full mb-10 overflow-hidden rounded-2xl shadow-lg">
            <img 
                src={blog.coverImage} 
                alt={blog.title || "Blog Cover"} 
                className="w-full h-auto object-cover max-h-[500px]" 
            />
        </div>
    )}
                    {blog.sections?.[0]?.type === "paragraph" && (
                        <div className="text-base text-gray-700 leading-relaxed mb-10">
                            <style jsx global>{`
                              .blog-intro h1 {
                                font-size: 2em;
                                font-weight: 800;
                                margin-top: 0.67em;
                                margin-bottom: 0.67em;
                                line-height: 1.2;
                              }
                              .blog-intro h2 {
                                font-size: 1.5em;
                                font-weight: 700;
                                margin-top: 0.83em;
                                margin-bottom: 0.83em;
                                line-height: 1.3;
                              }
                              .blog-intro p {
                                margin: 1em 0;
                              }
                              .blog-intro strong {
                                font-weight: 700;
                              }
                              .blog-intro em {
                                font-style: italic;
                              }
                              .blog-intro ul {
                                list-style-type: disc;
                                padding-left: 1.5em;
                                margin: 1em 0;
                              }
                              .blog-intro ol {
                                list-style-type: decimal;
                                padding-left: 1.5em;
                                margin: 1em 0;
                              }
                              .blog-intro li {
                                margin: 0.25em 0;
                              }
                              .blog-intro a {
                                color: #d11a2a;
                                text-decoration: underline;
                                cursor: pointer;
                              }
                              .blog-intro a:hover {
                                color: #000;
                              }
                            `}</style>
                            <div 
                                className="blog-intro"
                                dangerouslySetInnerHTML={{ __html: blog.sections[0].description }}
                            />
                        </div>
                    )}
                </header>

                {/* --- CONTENT SECTIONS --- */}
                <div className="space-y-16">
                    {blog.sections?.map((section: any, index: number) => {
                        // Skip the first paragraph since we used it in the header
                        if (index === 0 && section.type === "paragraph") return null;

                        return (
                            <div key={index} className="flex flex-col gap-6">
                                {/* Section Title */}
                                {section.title && (
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                        {section.title}
                                    </h2>
                                )}

                                {/* Section Image - If it exists, show it first (Box Style) */}
                                {section.imageUrl && (
                                    <div className="w-full bg-gray-50 border border-gray-100 overflow-hidden rounded-2xl">
                                        <img 
                                            src={section.imageUrl}
                                             
                                            alt={section.title || "Blog section"} 
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                )}

                                {/* Section Description */}
                                {section.description && (
                                    <div className="text-base text-gray-700 leading-relaxed">
                                        <style jsx global>{`
                                          .blog-content h1 {
                                            font-size: 2em;
                                            font-weight: 800;
                                            margin-top: 0.67em;
                                            margin-bottom: 0.67em;
                                            line-height: 1.2;
                                          }
                                          .blog-content h2 {
                                            font-size: 1.5em;
                                            font-weight: 700;
                                            margin-top: 0.83em;
                                            margin-bottom: 0.83em;
                                            line-height: 1.3;
                                          }
                                          .blog-content p {
                                            margin: 1em 0;
                                          }
                                          .blog-content strong {
                                            font-weight: 700;
                                          }
                                          .blog-content em {
                                            font-style: italic;
                                          }
                                          .blog-content ul {
                                            list-style-type: disc;
                                            padding-left: 1.5em;
                                            margin: 1em 0;
                                          }
                                          .blog-content ol {
                                            list-style-type: decimal;
                                            padding-left: 1.5em;
                                            margin: 1em 0;
                                          }
                                          .blog-content li {
                                            margin: 0.25em 0;
                                          }
                                          .blog-content a {
                                            color: #d11a2a;
                                            text-decoration: underline;
                                            cursor: pointer;
                                          }
                                          .blog-content a:hover {
                                            color: #000;
                                          }
                                        `}</style>
                                        <div 
                                            className="blog-content"
                                            dangerouslySetInnerHTML={{ __html: section.description }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </article>
                  {/* --- 5. MODERN FOOTER (ENHANCED & ALIGNED) --- */}
      <footer className="bg-[#0a0a0a] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">

          {/* TOP GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 items-start">

            {/* BRAND COLUMN */}
            <div className="space-y-8">
              <img src={LOGO_WHITE} alt="Logo" className="h-12" />

              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                The leading edge of lighting technology. Disrupting the standard to
                build a brighter, smarter world.
              </p>

              <div className="flex gap-4">
                {socials.map((soc, i) => (
                  <div
                    key={i}
                    className={`
                h-10 w-10 rounded-full
                bg-white/5 border border-white/10
                flex items-center justify-center
                cursor-pointer
                transition-all duration-300
                hover:bg-white/10 hover:-translate-y-1
                ${soc.color}
              `}
                  >
                    <soc.icon size={18} />
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d11a2a]">
                Quick Links
              </h4>

              <ul className="space-y-4">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="
                  text-gray-400 text-sm
                  flex items-center gap-2
                  hover:text-white
                  transition-colors
                  group
                "
                    >
                      <span className="h-[2px] w-0 bg-[#d11a2a] group-hover:w-3 transition-all" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* NEWSLETTER / INSIGHTS */}
            <div className="md:col-span-2 bg-white/5 backdrop-blur-xl rounded-[32px] p-10 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight mb-3">
                  Industry Insights
                </h4>

                <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">
                  Receive curated updates on smart lighting innovations, engineering
                  breakthroughs, and industry best practices — delivered straight to
                  your inbox.
                </p>

                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/10">
                  <input
                    type="email"
                    placeholder="Enter your business email"
                    className="
                bg-transparent flex-1 px-4 py-2
                text-sm text-white
                placeholder:text-gray-500
                outline-none
              "
                  />

                  <button
                    className="
                group flex items-center gap-2
                bg-[#d11a2a] px-4 py-3 rounded-xl
                hover:bg-[#b11422]
                transition-all duration-300
                shadow-lg
              "
                  >
                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                      Subscribe
                    </span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 mt-4">
                We respect your privacy. No spam, unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-gray-500 tracking-[0.25em] uppercase">
            <p>© 2026 Disruptive Solutions Inc.</p>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="
          flex items-center gap-2
          hover:text-[#d11a2a]
          transition-all
        "
            >
              Top <ChevronUp size={16} />
            </button>
          </div>

        </div>
      </footer>
        </div>
    );
}