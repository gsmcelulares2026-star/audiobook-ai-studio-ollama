import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileText, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Download, 
  Settings2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { structurePDFContent, generateSpeech, type StructuredBook, type Chapter } from "./lib/ollama";

export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<StructuredBook | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [voice, setVoice] = useState("Kore");
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeChapter = book?.chapters.find(c => c.id === activeChapterId);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!book) return;
    const currentIndex = book.chapters.findIndex(c => c.id === activeChapterId);
    if (currentIndex < book.chapters.length - 1) {
      const nextChapter = book.chapters[currentIndex + 1];
      setActiveChapterId(nextChapter.id);
      setAudioProgress(0);
      // Auto play next
      generateChapterAudio(nextChapter).then(() => {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to extract text from PDF");

      const data = await response.json();
      setIsUploading(false);
      setIsProcessing(true);

      // Call local Ollama backend to structure
      const structuredBook = await structurePDFContent(data.text);
      setBook(structuredBook);
      if (structuredBook.chapters.length > 0) {
        setActiveChapterId(structuredBook.chapters[0].id);
      }
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateChapterAudio = async (chapter: Chapter) => {
    if (chapter.audioUrl) return;

    setIsGeneratingAudio(true);
    try {
      const audioUrl = await generateSpeech(chapter.content, voice);
      if (audioUrl) {
        setBook(prev => {
          if (!prev) return null;
          return {
            ...prev,
            chapters: prev.chapters.map(c => 
              c.id === chapter.id ? { ...c, audioUrl } : c
            )
          };
        });
      }
    } catch (err) {
      console.error("Audio generation failed", err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (!activeChapter) return;
    
    if (!activeChapter.audioUrl) {
      await generateChapterAudio(activeChapter);
    }

    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#141414]/10 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <header className="mb-16 border-b border-[#141414]/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-4"
            >
              PDF2Audio<span className="text-white bg-[#141414] px-2 rounded-sm ml-2">AI</span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-mono text-sm opacity-60 uppercase tracking-widest"
            >
              Hardware-accelerated intelligent pipeline
            </motion.p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              id="settings-trigger"
              className="p-3 border border-[#141414]/20 rounded-full hover:bg-[#141414] hover:text-white transition-colors"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!book ? (
            <motion.section 
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              id="upload-interface"
              className="max-w-2xl mx-auto"
            >
              <div 
                id="drop-zone"
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-[#141414]/20 rounded-3xl p-12 text-center cursor-pointer hover:border-[#141414] transition-all bg-white/50 backdrop-blur-xl"
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-24 bg-[#141414] rounded-2xl flex items-center justify-center text-white rotate-[-3deg] group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                    {isUploading || isProcessing ? (
                      <Loader2 className="w-12 h-12 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12" />
                    )}
                  </div>
                </div>
                <h3 className="text-3xl font-black uppercase mb-2 tracking-tight">
                  {isUploading ? "Uploading Data..." : isProcessing ? "AI Scrutiny..." : "Feed the Machine"}
                </h3>
                <p className="font-mono text-xs opacity-50 uppercase tracking-wider mb-8">
                  PDF 1.4+ COMPLIANT • RAW TEXT EXTRACTION • CLOUD SYNC
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-[#141414]/5 rounded-full font-mono text-[10px] uppercase">Auto-Chapters</span>
                  <span className="px-3 py-1 bg-[#141414]/5 rounded-full font-mono text-[10px] uppercase">TTS Pro</span>
                  <span className="px-3 py-1 bg-[#141414]/5 rounded-full font-mono text-[10px] uppercase">OCR Enriched</span>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl flex items-center gap-3 font-mono text-xs uppercase"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </motion.section>
          ) : (
            <motion.section 
              key="reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              id="reader-interface"
              className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8"
            >
              <div id="content-pane" className="bg-white rounded-[2rem] p-8 lg:p-12 shadow-sm border border-[#141414]/5 flex flex-col min-h-[600px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#141414] text-white rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">{book.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(book));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href",     dataStr);
                      downloadAnchorNode.setAttribute("download", `${book.title.replace(/\s+/g, '_')}_audiobook.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-[#141414]/10 rounded-full hover:bg-[#141414]/5 transition-colors"
                  >
                    Export Project
                  </button>
                </div>

                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeChapterId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="max-w-2xl"
                    >
                      <input 
                        value={activeChapter?.title || ""} 
                        onChange={(e) => {
                          setBook(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              chapters: prev.chapters.map(c => 
                                c.id === activeChapterId ? { ...c, title: e.target.value } : c
                              )
                            };
                          });
                        }}
                        className="text-3xl font-black uppercase mb-8 tracking-tighter bg-transparent border-none focus:ring-0 w-full"
                      />
                      <div className="prose prose-stone prose-lg">
                        <textarea
                          value={activeChapter?.content || ""}
                          onChange={(e) => {
                            const newContent = e.target.value;
                            setBook(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                chapters: prev.chapters.map(c => 
                                  c.id === activeChapterId ? { ...c, content: newContent, audioUrl: undefined } : c
                                )
                              };
                            });
                          }}
                          className="w-full min-h-[400px] text-lg leading-relaxed text-[#141414]/80 whitespace-pre-wrap font-serif bg-transparent border-none focus:ring-0 resize-none overflow-hidden"
                          onInput={(e) => {
                             const target = e.target as HTMLTextAreaElement;
                             target.style.height = "auto";
                             target.style.height = target.scrollHeight + "px";
                          }}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-12 pt-8 border-t border-[#141414]/5">
                  <div id="audio-controls" className="flex flex-col md:flex-row items-center gap-8 bg-[#F6F5F2] p-6 rounded-2xl">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => {
                          if (!book) return;
                          const currentIndex = book.chapters.findIndex(c => c.id === activeChapterId);
                          if (currentIndex > 0) {
                            setActiveChapterId(book.chapters[currentIndex - 1].id);
                            setAudioProgress(0);
                            setIsPlaying(false);
                          }
                        }}
                        className="text-[#141414]/40 hover:text-[#141414] transition-colors"
                      >
                        <SkipBack className="w-6 h-6" />
                      </button>
                      <button 
                        id="play-button"
                        onClick={togglePlay}
                        disabled={isGeneratingAudio}
                        className="w-16 h-16 bg-[#141414] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                      >
                        {isGeneratingAudio ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-8 h-8 fill-current" />
                        ) : (
                          <Play className="w-8 h-8 fill-current translate-x-0.5" />
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          if (!book) return;
                          const currentIndex = book.chapters.findIndex(c => c.id === activeChapterId);
                          if (currentIndex < book.chapters.length - 1) {
                            setActiveChapterId(book.chapters[currentIndex + 1].id);
                            setAudioProgress(0);
                            setIsPlaying(false);
                          }
                        }}
                        className="text-[#141414]/40 hover:text-[#141414] transition-colors"
                      >
                        <SkipForward className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2">
                       <div className="flex items-center justify-between font-mono text-[10px] uppercase opacity-40">
                         <span>{isGeneratingAudio ? "Preparing Audio..." : "Current Stream"}</span>
                         <span>{activeChapter?.audioUrl ? "Cloud Synced" : "Pending Sync"}</span>
                       </div>
                       <div className="h-1.5 bg-[#141414]/10 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                          if (audioRef.current) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const pct = x / rect.width;
                            audioRef.current.currentTime = pct * audioRef.current.duration;
                          }
                       }}>
                         <motion.div 
                          className="h-full bg-[#141414]" 
                          style={{ width: `${audioProgress}%` }}
                         />
                       </div>
                    </div>

                    <div className="flex items-center gap-4 border-l border-[#141414]/10 pl-8">
                       <div className="flex flex-col">
                          <span className="font-mono text-[8px] uppercase opacity-40 mb-1">Voice Synth</span>
                          <select 
                            value={voice}
                            onChange={(e) => setVoice(e.target.value)}
                            className="font-mono text-[10px] uppercase font-bold bg-transparent border-none appearance-none cursor-pointer focus:ring-0 p-0"
                          >
                            <option value="Kore">Kore (Neutral)</option>
                            <option value="Puck">Puck (Cheerful)</option>
                            <option value="Charon">Charon (Deep)</option>
                            <option value="Fenrir">Fenrir (Bold)</option>
                            <option value="Zephyr">Zephyr (Soft)</option>
                          </select>
                       </div>

                       <div className="flex flex-col">
                          <span className="font-mono text-[8px] uppercase opacity-40 mb-1">Cadence</span>
                          <select 
                            value={playbackSpeed}
                            onChange={(e) => {
                              const speed = Number(e.target.value);
                              setPlaybackSpeed(speed);
                              if (audioRef.current) audioRef.current.playbackRate = speed;
                            }}
                            className="font-mono text-[10px] uppercase font-bold bg-transparent border-none appearance-none cursor-pointer focus:ring-0 p-0"
                          >
                            <option value={0.75}>0.75x</option>
                            <option value={1}>1.00x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.50x</option>
                            <option value={2}>2.00x</option>
                          </select>
                       </div>
                       <Volume2 className="w-4 h-4 opacity-40 ml-2" />
                    </div>
                  </div>
                  {activeChapter?.audioUrl && (
                    <audio 
                      ref={audioRef} 
                      src={activeChapter.audioUrl} 
                      className="hidden" 
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleEnded}
                      playbackRate={playbackSpeed}
                      onPlay={() => {}} // Re-render triggers
                      onPause={() => {}}
                    />
                  )}
                </div>
              </div>

              <aside id="side-rail">
                <div className="bg-[#141414]/5 rounded-[2rem] p-6 h-full border border-[#141414]/10">
                  <div className="flex items-center gap-2 mb-6 opacity-60">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Chapters</span>
                  </div>
                  <div className="space-y-2">
                    {book.chapters.map((chapter, idx) => (
                      <button
                        key={chapter.id}
                        onClick={() => setActiveChapterId(chapter.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${
                          activeChapterId === chapter.id 
                          ? "bg-[#141414] text-white shadow-lg" 
                          : "hover:bg-[#141414]/10"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`font-mono text-[9px] uppercase transition-opacity ${activeChapterId === chapter.id ? "opacity-60" : "opacity-30"}`}>
                            Module 0{idx + 1}
                          </span>
                          <span className="font-bold text-sm truncate max-w-[180px]">{chapter.title}</span>
                        </div>
                        {chapter.audioUrl ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${activeChapterId === chapter.id ? "text-white/40" : "opacity-20"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#141414] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 backdrop-blur-md bg-opacity-90">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="font-mono text-[10px] uppercase tracking-tighter">System Online</span>
             </div>
             <div className="h-4 w-[1px] bg-white/20" />
             <div className="flex items-center gap-4">
               <button className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[10px] uppercase">Docs</button>
               <button className="opacity-60 hover:opacity-100 transition-opacity font-mono text-[10px] uppercase">Report</button>
             </div>
        </div>
      </footer>
    </div>
  );
}
