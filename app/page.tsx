'use client';

import React, { useState, useRef } from 'react';
import { exportToZip } from '@/lib/export';
import { ICON_TAXONOMY } from '@/lib/taxonomy';
import { Monitor, Check, ChevronDown, Download, AlertCircle, RefreshCw, Layers, Upload, ImageIcon, LinkIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STYLE_PILLS = ["Contemporary", "Modern", "Elegant", "Professional", "Clean", "Minimal", "Premium", "Technical", "Rounded", "Sharp", "Outline", "Filled", "Two-tone", "Gradient", "Playful", "Corporate"];
const STYLE_DESCRIPTIONS: Record<string, string> = {
  "Contemporary": "Current, trendy design patterns",
  "Modern": "Clean, structural, and forward-looking",
  "Elegant": "Sophisticated with fine details",
  "Professional": "Trustworthy, corporate aesthetic",
  "Clean": "Uncluttered, crisp geometry",
  "Minimal": "Stripped down to essential forms",
  "Premium": "High-end, luxurious look",
  "Technical": "Precision-focused, engineering vibe",
  "Rounded": "Softened corners and friendly curves",
  "Sharp": "Crisp, precise right angles and points",
  "Outline": "Stroked paths with no fill",
  "Filled": "Solid shapes for high contrast",
  "Two-tone": "Uses two distinct colors for depth",
  "Gradient": "Smooth transitions between colors",
  "Playful": "Fun, whimsical, and approachable",
  "Corporate": "Standardized, enterprise-ready look"
};
const USE_CASES = ["Dashboard / UI", "Navigation System", "Status / Feedback", "Security / Cloud"];

type Preset = {
  id: string;
  name: string;
  styles: string[];
  colors: string[];
  lineStyle: string;
  cornerRadius: string;
  visualTone: string;
  exportFormat?: 'SVG' | 'PNG' | 'EPS';
  exportSize?: number;
};

export default function IconNestApp() {
  const [brandName, setBrandName] = useState("Stellar.ai");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Technical", "Minimal", "Outline", "Modern", "Professional"]);
  const [selectedUseCase, setSelectedUseCase] = useState("Dashboard / UI");
  
  const [sidebarTab, setSidebarTab] = useState<'brand' | 'presets'>('brand');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [presetToDeleteId, setPresetToDeleteId] = useState<string | null>(null);

  
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandColors, setBrandColors] = useState<string[]>(["#0F172A", "#38BDF8", "#F472B6", "#E2E8F0"]);
  const [visualTone, setVisualTone] = useState("Professional");
  const [cornerRadius, setCornerRadius] = useState("4px");
  const [lineStyle, setLineStyle] = useState("1.5pt");
  const [canvasBg, setCanvasBg] = useState<'light' | 'grid' | 'dark'>('grid');
  const [zoomLevel, setZoomLevel] = useState(200);

  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeneratingSet, setIsGeneratingSet] = useState(false);
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  const [generatedSet, setGeneratedSet] = useState<{name: string, svg: string, category?: string, tags?: string[]}[] | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'full' | 'brandKit'>('preview');
  
  // Icon Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareIcons, setCompareIcons] = useState<number[]>([]);
  
  // Generate More Icons State
  const [isGenerateMoreOpen, setIsGenerateMoreOpen] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [customIconNames, setCustomIconNames] = useState('');
  
  const [isGeneratingBrandKit, setIsGeneratingBrandKit] = useState(false);
  const [brandKit, setBrandKit] = useState<{favicon: string, avatar: string, palette: string} | null>(null);

  const [exportFormat, setExportFormat] = useState<'SVG' | 'PNG' | 'EPS'>('SVG');
  const [exportSize, setExportSize] = useState<number>(32);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIconIdx, setSelectedIconIdx] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  
  // Responsive sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };
  const getContrastRatio = (hexColor1: string, hexColor2: string) => {
    const rgb1 = hexToRgb(hexColor1) || { r: 0, g: 0, b: 0 };
    const rgb2 = hexToRgb(hexColor2) || { r: 255, g: 255, b: 255 };
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (lightest + 0.05) / (darkest + 0.05);
  };

  const primaryColor = brandColors[0] || "#0F172A";
  const contrastLight = getContrastRatio(primaryColor, "#ffffff").toFixed(2);
  const contrastDark = getContrastRatio(primaryColor, "#1e293b").toFixed(2);
  const isLightAccessible = Number(contrastLight) >= 3.0; // UI Component ratio
  const isDarkAccessible = Number(contrastDark) >= 3.0;

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [generationDuration, setGenerationDuration] = useState(0);
  const durationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const [extraComments, setExtraComments] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', time: '10:42 AM', text: 'Analysis complete. Alignment with Stellar.ai brand guidelines (Dark Slate / Sky Blue).' }
  ]);

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      styles: selectedStyles,
      colors: brandColors,
      lineStyle,
      cornerRadius,
      visualTone,
      exportFormat,
      exportSize
    };
    setPresets([...presets, newPreset]);
    setNewPresetName("");
    setToast({ message: "Preset saved!", type: "success" });
  };

  const handleLoadPreset = (preset: Preset) => {
    setSelectedStyles(preset.styles);
    setBrandColors(preset.colors);
    setLineStyle(preset.lineStyle);
    setCornerRadius(preset.cornerRadius);
    setVisualTone(preset.visualTone);
    if (preset.exportFormat) setExportFormat(preset.exportFormat);
    if (preset.exportSize) setExportSize(preset.exportSize);
    setToast({ message: `Loaded preset: ${preset.name}`, type: "success" });
  };

  const handleCopyPreset = (preset: Preset) => {
    const presetData = JSON.stringify(preset, null, 2);
    navigator.clipboard.writeText(presetData);
    setToast({ message: "Preset copied to clipboard!", type: "success" });
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
    setPresetToDeleteId(null);
    setToast({ message: "Preset deleted", type: "success" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeBrand = async () => {
    if (!logoBase64 && !websiteUrl) return;
    setIsAnalyzing(true);
    setError(null);
    setGenerationDuration(0);
    durationIntervalRef.current = setInterval(() => setGenerationDuration(prev => prev + 1), 1000);
    try {
      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: logoBase64, websiteUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.brandName) setBrandName(data.brandName);
      if (data.dominantColors || data.accentColors) {
        const newColors = [...(data.dominantColors || []), ...(data.accentColors || [])].slice(0, 4);
        while (newColors.length < 4) newColors.push("#E2E8F0");
        setBrandColors(newColors);
      }
      if (data.visualTone) setVisualTone(data.visualTone);
      if (data.suggestedStyles) setSelectedStyles(data.suggestedStyles);
      if (data.cornerRadius) setCornerRadius(data.cornerRadius);
      if (data.lineStyle) setLineStyle(data.lineStyle);
      
      setChatHistory(prev => [...prev, { role: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Analysis complete. Alignment with ${data.brandName || brandName} brand guidelines (${data.visualTone || 'Neutral'}).` }]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    setError(null);
    setGenerationDuration(0);
    durationIntervalRef.current = setInterval(() => setGenerationDuration(prev => prev + 1), 1000);
    try {
      if (extraComments) {
        setChatHistory([...chatHistory, { role: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: extraComments }]);
      }
      
      const res = await fetch('/api/generate-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          colors: brandColors,
          visualTone,
          styles: selectedStyles,
          useCase: selectedUseCase,
          extraComments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPreviewSvg(data.svg);
      setExtraComments("");
      setViewMode('preview');
      
      if (extraComments) {
         setChatHistory(prev => [...prev, { role: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: 'Preview updated based on your comments.' }]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingPreview(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const handleGenerateVariation = async () => {
    if (selectedIconIdx === null || !generatedSet) return;
    
    setIsGeneratingVariation(true);
    setError(null);
    const selectedIcon = generatedSet[selectedIconIdx];
    
    try {
      const res = await fetch('/api/generate-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          colors: brandColors,
          visualTone,
          styles: selectedStyles,
          useCase: selectedIcon.name,
          extraComments: "Provide an alternative design or variation for this specific icon concept."
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const newSet = [...generatedSet];
      newSet[selectedIconIdx] = { ...selectedIcon, svg: data.svg };
      setGeneratedSet(newSet);
      setToast({ message: "Variation generated successfully!", type: "success" });
    } catch (err: any) {
      setError(err.message);
      setToast({ message: "Failed to generate variation.", type: "error" });
    } finally {
      setIsGeneratingVariation(false);
    }
  };

  const handleGenerateSet = async () => {
    setIsGeneratingSet(true);
    setError(null);
    setGenerationDuration(0);
    durationIntervalRef.current = setInterval(() => setGenerationDuration(prev => prev + 1), 1000);
    try {
      const taxonomyModule = await import('@/lib/taxonomy');
      const taxonomy = taxonomyModule.ICON_TAXONOMY;
      let allIcons: {name: string, svg: string, category: string, tags?: string[]}[] = [];
      setGeneratedSet([]); // Clear previous
      setViewMode('full');

      const categories = Object.keys(taxonomy);
      
      // We will generate the categories in batches to respect API limits but still produce the full set.
      const batchSize = 2;
      for (let i = 0; i < categories.length; i += batchSize) {
        const batch = categories.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (category) => {
          const iconsToGenerate = taxonomy[category as keyof typeof taxonomy];
          
          const res = await fetch('/api/generate-set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brandName,
              colors: brandColors,
              visualTone,
              styles: selectedStyles,
              category,
              iconsToGenerate
            })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return (data.icons || []).map((icon: any) => ({ ...icon, category }));
        });
        
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            const mappedIcons = result.value;
            allIcons = [...allIcons, ...mappedIcons];
          } else {
            console.error("Failed to generate a category:", result.reason);
          }
        });
        
        // Update UI incrementally after each batch
        setGeneratedSet([...allIcons]);
      }
      
      setChatHistory(prev => [...prev, { role: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Full core icon set generated successfully (${allIcons.length} icons).` }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingSet(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const handleGenerateMoreIcons = async () => {
    if (!customIconNames.trim()) return;
    
    setIsGeneratingMore(true);
    setError(null);
    setGenerationDuration(0);
    durationIntervalRef.current = setInterval(() => setGenerationDuration(prev => prev + 1), 1000);
    
    const allIconsToGenerate = customIconNames.split(',').map(s => s.trim()).filter(Boolean);
    const chunkSize = 15;
    let allNewIcons: any[] = [];
    
    try {
      // Chunking to prevent AI timeouts for very large sets (e.g. 100+ icons)
      for (let i = 0; i < allIconsToGenerate.length; i += chunkSize) {
        const chunk = allIconsToGenerate.slice(i, i + chunkSize);
        
        const res = await fetch('/api/generate-set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName,
            colors: brandColors,
            visualTone,
            styles: selectedStyles,
            category: 'Custom / Added',
            iconsToGenerate: chunk
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        const mappedIcons = (data.icons || []).map((icon: any) => ({ ...icon, category: 'Custom / Added' }));
        allNewIcons = [...allNewIcons, ...mappedIcons];
        
        // Update incrementally
        setGeneratedSet(prev => {
          const base = prev || [];
          return [...base, ...mappedIcons];
        });
      }
      
      setChatHistory(prev => [...prev, { role: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Added ${allNewIcons.length} new icons.` }]);
      
      setCustomIconNames('');
      setIsGenerateMoreOpen(false);
      setToast({ message: `Successfully added ${allNewIcons.length} icons.`, type: 'success' });
    } catch (err: any) {
      setError(err.message);
      setToast({ message: 'Failed to generate more icons.', type: 'error' });
    } finally {
      setIsGeneratingMore(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const handleGenerateBrandKit = async () => {
    setIsGeneratingBrandKit(true);
    setError(null);
    setGenerationDuration(0);
    durationIntervalRef.current = setInterval(() => setGenerationDuration(prev => prev + 1), 1000);
    
    try {
      const res = await fetch('/api/generate-brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          colors: brandColors,
          visualTone,
          styles: selectedStyles
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setBrandKit(data);
      setViewMode('brandKit');
      setChatHistory(prev => [...prev, { role: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Brand Kit generated successfully.` }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingBrandKit(false);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isGeneratingPreview) {
          handleGeneratePreview();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('idx', idx.toString());
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (!generatedSet) return;
    const dragIdx = parseInt(e.dataTransfer.getData('idx'), 10);
    if (dragIdx === dropIdx || isNaN(dragIdx)) return;
    const newSet = [...generatedSet];
    const item = newSet[dragIdx];
    newSet.splice(dragIdx, 1);
    newSet.splice(dropIdx, 0, item);
    setGeneratedSet(newSet);
  };

  const handleExport = async () => {
    if (generatedSet) {
      try {
        await exportToZip(generatedSet, brandName, exportFormat, exportSize);
        setToast({ message: "Export successful!", type: "success" });
      } catch (e) {
        setToast({ message: "Export failed.", type: "error" });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAFAFA] text-slate-800 font-sans overflow-hidden">
      {toast && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        </AnimatePresence>
      )}
      {/* Top Nav */}
      <nav className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          >
            {leftSidebarOpen ? <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>}
          </button>
          <div className="bg-slate-900 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner">
            <Layers className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block text-slate-900">IconNest <span className="text-slate-400 font-medium">Studio</span></span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="text-xs md:text-sm text-slate-500 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline-block">Brand: <strong className="text-slate-800 font-semibold">{brandName}</strong> <span className="text-slate-400 ml-1">Sync Active</span></span>
            <span className="sm:hidden text-slate-800 font-bold truncate max-w-[80px]">{brandName}</span>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <div className="flex gap-2 items-center">
            <div className="hidden sm:flex gap-2 items-center bg-slate-50 p-1 rounded-lg border border-slate-200/60">
              <select 
                value={exportFormat} 
                onChange={e => setExportFormat(e.target.value as any)}
                className="bg-transparent text-slate-700 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                <option value="SVG">SVG</option>
                <option value="PNG">PNG</option>
                <option value="EPS">EPS</option>
              </select>
              {exportFormat === 'PNG' && (
                <>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <select 
                    value={exportSize} 
                    onChange={e => setExportSize(Number(e.target.value))}
                    className="bg-transparent text-slate-700 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                  >
                    <option value={16}>16px</option>
                    <option value={20}>20px</option>
                    <option value={24}>24px</option>
                    <option value={32}>32px</option>
                    <option value={48}>48px</option>
                    <option value={64}>64px</option>
                    <option value={128}>128px</option>
                    <option value={256}>256px</option>
                    <option value={512}>512px</option>
                  </select>
                </>
              )}
            </div>
            <button 
              onClick={handleExport}
              disabled={!generatedSet}
              className="bg-slate-900 text-white rounded-lg px-4 py-2 font-medium text-xs md:text-sm hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline-block">Export</span>
            </button>
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              {rightSidebarOpen ? <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="21" y2="21"/><line x1="4" x2="20" y1="14" y2="14"/><line x1="4" x2="20" y1="7" y2="7"/></svg>}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div 
            className="md:hidden absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-30" 
            onClick={() => { setLeftSidebarOpen(false); setRightSidebarOpen(false); }}
          />
        )}
        
        {/* Sidebar Left */}
        <aside className={`w-[320px] bg-white border-r border-slate-200/60 flex flex-col shrink-0 absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${leftSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="flex border-b border-slate-200 shrink-0">
            <button 
              onClick={() => setSidebarTab('brand')}
              className={`flex-1 py-4 text-[10px] font-semibold uppercase tracking-wide transition-colors ${sidebarTab === 'brand' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Brand Setup
            </button>
            <button 
              onClick={() => setSidebarTab('presets')}
              className={`flex-1 py-4 text-[10px] font-semibold uppercase tracking-wide transition-colors ${sidebarTab === 'presets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Preset Library
            </button>
          </div>

          {sidebarTab === 'brand' ? (
            <>
              <div className="p-6 border-b border-slate-200/60">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Brand Identity</label>
                
                <div className="space-y-4 mb-5">
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="Website URL"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="text-sm bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-full rounded-lg pl-8 pr-3 py-2 transition-shadow" 
                        />
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <label className="bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <Upload className="w-4 h-4 text-slate-500" />
                      </label>
                    </div>
                    {logoBase64 && <div className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Logo attached</div>}
                  </div>
                  <button 
                    onClick={handleAnalyzeBrand}
                    disabled={isAnalyzing || (!logoBase64 && !websiteUrl)}
                    className="w-full bg-slate-900 text-white rounded-lg text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {isAnalyzing ? `Analyzing... (${generationDuration}s)` : 'Analyze Brand'}
                  </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {logoBase64 ? <img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-1" /> : <Layers className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input 
                      type="text" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Brand Name"
                      className="text-sm font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-full rounded px-1 -ml-1 placeholder-slate-300 text-slate-900" 
                    />
                    <div className="text-xs text-slate-400 truncate mt-0.5 ml-1">{visualTone}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="text-xs font-semibold text-slate-500 mb-3">Extracted Palette</div>
                  <div className="flex flex-wrap gap-2.5">
                    {brandColors.map((color, i) => (
                      <div key={i} className="relative group w-6 h-6">
                        <label className="w-full h-full rounded border border-black/10 cursor-pointer overflow-hidden block">
                          <input 
                            type="color" 
                            value={color}
                            onChange={(e) => {
                              const newColors = [...brandColors];
                              newColors[i] = e.target.value;
                              setBrandColors(newColors);
                            }}
                            className="absolute -inset-2 w-10 h-10 opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: color }}></div>
                        </label>
                        {brandColors.length > 1 && (
                          <button 
                            onClick={() => {
                              const newColors = brandColors.filter((_, idx) => idx !== i);
                              setBrandColors(newColors);
                            }}
                            className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                          >
                            <svg className="w-2.5 h-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {brandColors.length < 8 && (
                      <button 
                        onClick={() => setBrandColors([...brandColors, "#E2E8F0"])}
                        className="w-6 h-6 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Style Parameters</label>
                <div className="flex flex-wrap gap-2 mb-6">
                  {STYLE_PILLS.map(style => {
                    const isSelected = selectedStyles.includes(style);
                    return (
                    <div key={style} className="relative group">
                      <button 
                        onClick={() => toggleStyle(style)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${isSelected ? 'bg-slate-900 text-white shadow-sm border border-slate-900' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm'}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {style}
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-200 z-50 text-center leading-tight">
                        {STYLE_DESCRIPTIONS[style]}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  )})}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Use Case Context</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {USE_CASES.map(uc => (
                      <button 
                        key={uc}
                        onClick={() => setSelectedUseCase(uc)}
                        className={`p-2.5 rounded-lg text-sm flex justify-between items-center transition-colors ${selectedUseCase === uc ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <span>{uc}</span>
                        {selectedUseCase === uc && <Check className="w-4 h-4 text-slate-900" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Save Current</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Preset Name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 text-sm border border-slate-200/60 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-shadow"
                  />
                  <button 
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim()}
                    className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saved Presets</label>
                {presets.length === 0 ? (
                  <div className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">No presets saved yet.</div>
                ) : (
                  presets.map(p => (
                    <div key={p.id} className="border border-slate-200/60 rounded-xl p-4 flex flex-col gap-3 bg-white hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                      {presetToDeleteId === p.id ? (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-3 text-center gap-3">
                          <span className="text-sm font-semibold text-slate-900">Delete preset?</span>
                          <div className="flex gap-2 w-full justify-center">
                            <button onClick={() => handleDeletePreset(p.id)} className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm">Yes, delete</button>
                            <button onClick={() => setPresetToDeleteId(null)} className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors px-4 py-2 rounded-lg font-medium">Cancel</button>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900 truncate pr-2">{p.name}</span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleCopyPreset(p)} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-slate-100" title="Copy to clipboard">
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                          <button onClick={() => handleLoadPreset(p)} className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">Load</button>
                          <button onClick={() => setPresetToDeleteId(p.id)} className="text-[11px] text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg font-bold">✕</button>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {p.colors.map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded shadow-sm border border-black/5" style={{ backgroundColor: c }}></div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.styles.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md text-slate-500 font-medium">{s}</span>
                        ))}
                        {p.styles.length > 3 && <span className="text-[10px] bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md text-slate-400 font-medium">+{p.styles.length - 3}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 bg-slate-50 flex flex-col relative min-w-0">
          <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-6 justify-between z-10 shadow-sm relative">
            <div className="flex gap-4">
              <div className="bg-slate-100/50 p-1 rounded-xl flex gap-1 border border-slate-200/50">
                <button 
                  onClick={() => { setViewMode('preview'); setIsCompareMode(false); }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${viewMode === 'preview' ? 'bg-white border border-slate-200/60 shadow-sm font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Preview Icon
                </button>
                <button 
                  onClick={() => { setViewMode('full'); setIsCompareMode(false); }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${viewMode === 'full' ? 'bg-white border border-slate-200/60 shadow-sm font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Full Set (200+)
                </button>
                <button 
                  onClick={() => { setViewMode('brandKit'); setIsCompareMode(false); }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${viewMode === 'brandKit' ? 'bg-white border border-slate-200/60 shadow-sm font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  Brand Kit
                </button>
              </div>
              
              {viewMode === 'full' && generatedSet && generatedSet.length > 0 && (
                <>
                  <button
                    onClick={() => setIsGenerateMoreOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add More Icons
                  </button>
                  <button
                    onClick={() => {
                      setIsCompareMode(!isCompareMode);
                      setCompareIcons([]);
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border shadow-sm ${isCompareMode ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-700 border-slate-200/60 hover:bg-slate-50'}`}
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>
                    {isCompareMode ? 'Cancel Compare' : 'Compare Icons'}
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-4 items-center">
              {viewMode === 'full' && (
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm bg-slate-50 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-900/10 rounded-lg pl-9 pr-3 py-1.5 w-60 transition-all focus:bg-white"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
              )}
              <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100/50 border border-slate-200/50 px-2 py-1.5 rounded-lg">
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 50))} className="p-1 hover:text-slate-900 hover:bg-slate-200/50 rounded transition-colors"><ZoomOut className="w-4 h-4" /></button>
                <span className="w-[85px] text-center font-medium tabular-nums">Zoom: {zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(400, zoomLevel + 50))} className="p-1 hover:text-slate-900 hover:bg-slate-200/50 rounded transition-colors"><ZoomIn className="w-4 h-4" /></button>
              </div>
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              <div className="flex bg-slate-100/50 border border-slate-200/50 p-1 rounded-lg relative w-48">
                <div 
                  className="absolute top-1 bottom-1 w-[calc(33.33%-2.66px)] bg-white rounded-md shadow-sm transition-transform duration-200 ease-out border border-slate-200/50" 
                  style={{ transform: `translateX(${canvasBg === 'light' ? '0' : canvasBg === 'grid' ? '100%' : '200%'})` }}
                ></div>
                <button onClick={() => setCanvasBg('light')} className={`relative flex-1 rounded px-2 py-1 text-xs text-center z-10 transition-colors ${canvasBg === 'light' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Light</button>
                <button onClick={() => setCanvasBg('grid')} className={`relative flex-1 rounded px-2 py-1 text-xs text-center z-10 transition-colors ${canvasBg === 'grid' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Grid</button>
                <button onClick={() => setCanvasBg('dark')} className={`relative flex-1 rounded px-2 py-1 text-xs text-center z-10 transition-colors ${canvasBg === 'dark' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Dark</button>
              </div>
            </div>
          </div>
          
          <div 
            className={`flex-1 flex items-center justify-center relative p-8 overflow-y-auto shadow-inner ${canvasBg === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`} 
            style={canvasBg === 'grid' ? { backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '24px 24px' } : undefined}
          >
            {viewMode === 'preview' ? (
              <div className={`w-80 h-80 rounded-xl shadow-lg border flex items-center justify-center relative transition-transform ${canvasBg === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}>
                 {previewSvg && !isGeneratingPreview && !error && (
                  <>
                    <button
                      onClick={() => {
                        const blob = new Blob([previewSvg], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${brandName || 'preview'}-icon.svg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setToast({ message: "Exported preview SVG", type: "success" });
                      }}
                      className={`absolute top-4 right-4 border text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors z-10 ${canvasBg === 'dark' ? 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 border-slate-700' : 'bg-white/80 hover:bg-white backdrop-blur border-slate-200'}`}
                    >
                      <Download className="w-3.5 h-3.5" /> Export SVG
                    </button>

                    <div className={`absolute top-4 left-4 flex flex-col gap-1 text-[10px] font-mono z-10 p-2 rounded-md border backdrop-blur shadow-sm ${canvasBg === 'dark' ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-600'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: primaryColor}}></span>
                        <span>Contrast (WCAG 2.2)</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <span>Light: {contrastLight}</span>
                        {isLightAccessible ? <Check className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Dark: {contrastDark}</span>
                        {isDarkAccessible ? <Check className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                      </div>
                    </div>
                  </>
                 )}
                {isGeneratingPreview ? (
                  <div className={`flex flex-col items-center gap-4 ${canvasBg === 'dark' ? 'text-slate-300' : 'text-slate-400'}`}>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="animate-spin text-blue-500 w-12 h-12 absolute inset-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="text-[10px] font-mono font-medium">{generationDuration}s</span>
                    </div>
                    <span className="text-sm font-medium">Crafting your icon...</span>
                  </div>
                ) : error ? (
                  <div className={`flex flex-col items-center gap-3 text-center px-6 ${canvasBg === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-1">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <span className="text-slate-800 font-semibold text-base">Service briefly busy</span>
                    <span className="text-xs text-slate-500 max-w-[200px]">Our generation service is experiencing high demand. Please try again.</span>
                    <button 
                      onClick={handleGeneratePreview}
                      className="mt-2 bg-slate-800 text-white px-5 py-2 rounded-md text-xs font-medium hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : previewSvg ? (
                  <div 
                    className={`w-full h-full flex items-center justify-center p-8 [&>svg]:w-full [&>svg]:h-full ${canvasBg === 'dark' ? '[&>svg]:stroke-slate-100 [&>svg]:fill-slate-100' : ''}`}
                    dangerouslySetInnerHTML={{ __html: previewSvg }} 
                  />
                ) : (
                  <div className={`flex flex-col items-center gap-4 text-center px-6 ${canvasBg === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${canvasBg === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50 border border-slate-100'}`}>
                      <ImageIcon className={`w-8 h-8 ${canvasBg === 'dark' ? 'text-slate-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-700 font-semibold text-base">Ready to generate</span>
                      <span className="text-xs max-w-[200px]">Configure your brand and style settings on the left, then generate a preview.</span>
                    </div>
                  </div>
                )}
                {previewSvg && !error && !isGeneratingPreview && (
                  <div className={`absolute bottom-4 right-4 text-[10px] font-mono px-2 py-1 rounded ${canvasBg === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400 shadow-sm border border-slate-100'}`}>preview-icon.svg</div>
                )}
              </div>
            ) : viewMode === 'full' ? (
              <div className="w-full max-w-4xl max-h-full overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                {isGeneratingSet ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="animate-spin text-blue-500 w-12 h-12 absolute inset-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="text-[10px] font-mono font-medium">{generationDuration}s</span>
                    </div>
                    <span className="text-sm font-medium">Generating Full Set...</span>
                  </div>
                ) : error && !generatedSet ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-6 text-slate-500">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-1">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <span className="text-slate-800 font-semibold text-base">Service briefly busy</span>
                    <span className="text-xs text-slate-500 max-w-[250px]">Our generation service is experiencing high demand. Please try again.</span>
                    <button 
                      onClick={handleGenerateSet}
                      className="mt-2 bg-slate-800 text-white px-5 py-2 rounded-md text-xs font-medium hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : generatedSet && generatedSet.length > 0 ? (
                  <div className="flex flex-col gap-10">
                    {Array.from(new Set(generatedSet.map(i => i.category || 'Uncategorized'))).map(category => {
                      const filteredCategoryIcons = generatedSet.filter(i => 
                        i.category === category && 
                        (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (i.tags && i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                         category.toLowerCase().includes(searchQuery.toLowerCase()))
                      );

                      if (filteredCategoryIcons.length === 0) return null;

                      return (
                        <div key={category} className="flex flex-col gap-6">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                             <span className="text-sm font-bold text-slate-800 tracking-tight">{category}</span>
                             <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredCategoryIcons.length} icons</span>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-6">
                            {filteredCategoryIcons.map((icon, idx) => {
                              const globalIdx = generatedSet.indexOf(icon);
                              return (
                                <motion.div 
                                  key={globalIdx} 
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
                                >
                                  <div 
                                    className={`flex flex-col items-center gap-3 cursor-pointer ${isCompareMode ? (compareIcons.includes(globalIdx) ? 'ring-2 ring-blue-500 bg-blue-50/50 rounded-lg p-1' : '') : (selectedIconIdx === globalIdx ? 'ring-2 ring-blue-500 rounded-lg p-1' : '')}`}
                                    draggable={!isCompareMode}
                                    onDragStart={(e) => !isCompareMode && handleDragStart(e, globalIdx)}
                                    onDragOver={!isCompareMode ? handleDragOver : undefined}
                                    onDrop={(e) => !isCompareMode && handleDrop(e, globalIdx)}
                                    onClick={() => {
                                      if (isCompareMode) {
                                        if (compareIcons.includes(globalIdx)) {
                                          setCompareIcons(compareIcons.filter(id => id !== globalIdx));
                                        } else if (compareIcons.length < 2) {
                                          setCompareIcons([...compareIcons, globalIdx]);
                                        }
                                      } else {
                                        setSelectedIconIdx(globalIdx);
                                      }
                                    }}
                                  >
                                    <div 
                                      className="w-16 h-16 text-slate-800 [&>svg]:w-full [&>svg]:h-full p-2 border border-slate-200/60 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all bg-white"
                                      dangerouslySetInnerHTML={{ __html: icon.svg }}
                                    />
                                    <div className="text-[10px] text-slate-400 font-mono pointer-events-none text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-1">{icon.name}.svg</div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-5 text-slate-400">
                    <div className="flex gap-3 mb-2 opacity-30">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-8 h-8 rounded-sm bg-slate-200"></div></div>
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-6 h-6 rounded-full bg-slate-200"></div></div>
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-8 h-8 rotate-45 rounded-sm bg-slate-200"></div></div>
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                      <span className="text-slate-800 font-bold text-lg tracking-tight">Your generated set</span>
                      <span className="text-sm max-w-[300px] text-slate-500">Approve your preview icon on the right to generate a cohesive set of beautiful icons.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === 'brandKit' ? (
              <div className="w-full max-w-5xl h-full flex flex-col gap-6 overflow-y-auto px-4 py-8">
                {isGeneratingBrandKit ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="animate-spin text-blue-500 w-12 h-12 absolute inset-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="text-[10px] font-mono font-medium">{generationDuration}s</span>
                    </div>
                    <span className="text-sm font-medium">Generating Brand Kit...</span>
                  </div>
                ) : brandKit ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Favicon Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-6">
                      <div className="w-full border-b border-slate-100 pb-3 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 text-sm">Favicon</span>
                        <span className="text-[10px] font-mono text-slate-400">32x32</span>
                      </div>
                      <div className="w-24 h-24 flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-lg shadow-inner [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{__html: brandKit.favicon}} />
                    </div>
                    
                    {/* Avatar Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-6">
                      <div className="w-full border-b border-slate-100 pb-3 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 text-sm">Social Avatar</span>
                        <span className="text-[10px] font-mono text-slate-400">512x512</span>
                      </div>
                      <div className="w-32 h-32 flex items-center justify-center rounded-full overflow-hidden shadow-md [&>svg]:w-full [&>svg]:h-full bg-slate-50 border border-slate-100" dangerouslySetInnerHTML={{__html: brandKit.avatar}} />
                    </div>

                    {/* Palette Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-6 lg:col-span-1 md:col-span-2 lg:col-start-auto">
                      <div className="w-full border-b border-slate-100 pb-3 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 text-sm">Primary Palette</span>
                        <span className="text-[10px] font-mono text-slate-400">400x200</span>
                      </div>
                      <div className="w-full max-w-[400px] aspect-[2/1] rounded-lg overflow-hidden shadow-sm [&>svg]:w-full [&>svg]:h-full border border-slate-100 bg-slate-50" dangerouslySetInnerHTML={{__html: 
                        brandColors.length > 0 ? (() => {
                          const colorWidth = 400 / brandColors.length;
                          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
                            <defs>
                              <clipPath id="rounded">
                                <rect x="0" y="0" width="400" height="200" rx="16" ry="16" />
                              </clipPath>
                            </defs>
                            <g clip-path="url(#rounded)">
                              ${brandColors.map((color, i) => `<rect x="${i * colorWidth}" y="0" width="${colorWidth + 1}" height="200" fill="${color}" />`).join('')}
                            </g>
                            <text x="20" y="170" font-family="sans-serif" font-weight="bold" font-size="24" fill="${getContrastRatio(brandColors[0], '#ffffff') > 2.5 ? '#ffffff' : '#000000'}">${brandName || 'Brand'}</text>
                          </svg>`;
                        })() : brandKit.palette
                      }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 text-center">
                     <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shadow-sm mb-2">
                       <Layers className="w-8 h-8 text-slate-300" />
                     </div>
                     <span className="text-slate-900 font-bold text-lg tracking-tight">Brand Kit</span>
                     <span className="text-sm max-w-[320px] text-slate-500 font-medium">Generate a unified brand kit including a favicon, social media avatar, and primary color palette based on your current settings.</span>
                     <button onClick={handleGenerateBrandKit} className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm">
                       Generate Kit
                     </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-5 py-2.5 rounded-full flex gap-5 text-white text-[11px] font-medium tracking-wide shadow-2xl">
               <div className="flex items-center gap-2"><span>Corner: {cornerRadius}</span></div>
               <div className="w-px bg-white/20"></div>
               <div className="flex items-center gap-2"><span>Stroke: {lineStyle}</span></div>
               <div className="w-px bg-white/20"></div>
               <div className="flex items-center gap-2"><span>Tone: {visualTone.split(' ')[0]}</span></div>
            </div>
          </div>
        </main>

        {/* Sidebar Right */}
        <aside className={`w-[320px] bg-white border-l border-slate-200/60 flex flex-col shrink-0 absolute inset-y-0 right-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${rightSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
          {viewMode === 'full' && selectedIconIdx !== null && generatedSet && generatedSet[selectedIconIdx] ? (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Icon Properties</label>
                <button onClick={() => setSelectedIconIdx(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="w-full aspect-square border border-slate-200/60 rounded-xl p-8 bg-slate-50 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-slate-800 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: generatedSet[selectedIconIdx].svg }}
                  />
                  <button
                    onClick={handleGenerateVariation}
                    disabled={isGeneratingVariation}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-lg py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                  >
                    {isGeneratingVariation ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Generate Variation
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                  <input 
                    type="text" 
                    value={generatedSet[selectedIconIdx].name}
                    onChange={(e) => {
                      const newSet = [...generatedSet];
                      newSet[selectedIconIdx].name = e.target.value;
                      setGeneratedSet(newSet);
                    }}
                    className="w-full text-sm border border-slate-200/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white transition-shadow"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <div className="w-full text-sm border border-slate-200/60 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed">
                    {generatedSet[selectedIconIdx].category || 'Uncategorized'}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {(generatedSet[selectedIconIdx].tags || []).map((tag, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium">
                        {tag}
                        <button 
                          onClick={() => {
                            const newSet = [...generatedSet];
                            newSet[selectedIconIdx].tags = (newSet[selectedIconIdx].tags || []).filter((_, idx) => idx !== i);
                            setGeneratedSet(newSet);
                          }}
                          className="hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text"
                    value={newTag}
                    placeholder="Add tag and press Enter..."
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        e.preventDefault();
                        const newSet = [...generatedSet];
                        const currentTags = newSet[selectedIconIdx].tags || [];
                        if (!currentTags.includes(newTag.trim())) {
                          newSet[selectedIconIdx].tags = [...currentTags, newTag.trim()];
                          setGeneratedSet(newSet);
                        }
                        setNewTag('');
                      }
                    }}
                    className="w-full text-sm border border-slate-200/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white transition-shadow"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Master Controls</label>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className={`${!previewSvg ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' : 'border border-slate-200/60 bg-white text-slate-700 hover:bg-slate-50'} rounded-lg py-2.5 px-4 font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full`}
                  >
                    {previewSvg ? 'Regenerate Preview' : 'Generate Preview'}
                  </button>
                  <button 
                    onClick={handleGenerateSet}
                    disabled={isGeneratingSet || isGeneratingPreview || !previewSvg}
                    className={`${previewSvg ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700' : 'bg-slate-50 text-slate-400 border border-slate-200/60'} rounded-lg py-2.5 px-4 font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full`}
                  >
                    Approve & Generate Set
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Comments & Iterations</label>
                <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-sm mb-4 overflow-y-auto flex flex-col gap-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`${msg.role === 'user' ? 'border-l-2 border-slate-900 pl-3' : 'pl-3'}`}>
                      <div className="font-bold mb-1 text-slate-900 flex items-baseline gap-2">
                        {msg.role === 'user' ? 'You' : 'System'} <span className="font-medium text-slate-400 text-xs">{msg.time}</span>
                      </div>
                      <div className="text-slate-600 leading-relaxed text-sm">{msg.text}</div>
                    </div>
                  ))}
                </div>
                <textarea 
                  value={extraComments}
                  onChange={(e) => setExtraComments(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (extraComments.trim() && !isGeneratingPreview) {
                        handleGeneratePreview();
                      }
                    }
                  }}
                  placeholder="Add a comment to refine (Press Enter to regenerate)..." 
                  className="w-full h-24 border border-slate-200/60 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white shadow-sm transition-shadow"
                ></textarea>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                  <span className="font-semibold uppercase tracking-wider">Version History</span>
                  <span className="hover:text-slate-900 cursor-pointer transition-colors font-medium">View All</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-lg shadow-sm"></div>
                  <div className="w-10 h-10 bg-white border border-slate-200/60 rounded-lg opacity-60 hover:opacity-100 cursor-pointer transition-opacity"></div>
                  <div className="w-10 h-10 bg-white border border-slate-200/60 rounded-lg opacity-40 hover:opacity-100 cursor-pointer transition-opacity"></div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
      
      {/* Generate More Icons Overlay */}
      <AnimatePresence>
        {isGenerateMoreOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Generate Additional Icons</h3>
                <button 
                  onClick={() => setIsGenerateMoreOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isGeneratingMore}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-8 flex flex-col gap-6 bg-slate-50/50">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Quick Add Groups</label>
                  <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto p-4 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                    {Object.entries(ICON_TAXONOMY).map(([groupName, icons]) => (
                      <button
                        key={groupName}
                        onClick={() => {
                          const currentNames = customIconNames.split(',').map(s => s.trim()).filter(Boolean);
                          const newNames = Array.from(new Set([...currentNames, ...icons])).join(', ');
                          setCustomIconNames(newNames);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200/60 text-slate-600 rounded-lg hover:border-slate-900 hover:text-slate-900 hover:bg-white transition-all shadow-sm active:scale-[0.98]"
                      >
                        + {groupName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 tracking-wide">Required Icons (comma separated)</label>
                  <textarea 
                    placeholder="e.g. Shopping cart, user settings, billing history..."
                    value={customIconNames}
                    onChange={(e) => setCustomIconNames(e.target.value)}
                    className="w-full border border-slate-200/60 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 min-h-[140px] resize-y bg-white shadow-sm transition-shadow"
                    disabled={isGeneratingMore}
                  />
                  <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
                    Enter any specific icons you need. They will be generated in the current brand style and appended to your active set. For a large enterprise-grade set, you can paste in standard grouped lists (e.g., Billing and finance).
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                  <button 
                    onClick={() => setIsGenerateMoreOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors disabled:opacity-50"
                    disabled={isGeneratingMore}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerateMoreIcons}
                    disabled={!customIconNames.trim() || isGeneratingMore}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating... ({generationDuration}s)
                      </>
                    ) : (
                      'Generate Icons'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Comparison Overlay */}
      <AnimatePresence>
        {isCompareMode && compareIcons.length === 2 && generatedSet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Icon Comparison</h3>
                <button 
                  onClick={() => setCompareIcons([])} 
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="flex-1 p-8 flex flex-col md:flex-row gap-10 overflow-y-auto bg-slate-50/50">
                <div className="flex-1 flex flex-col items-center gap-5">
                  <div className="w-full aspect-square border border-slate-200/60 bg-white rounded-2xl p-10 flex items-center justify-center shadow-sm [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: generatedSet[compareIcons[0]].svg }}
                  />
                  <div className="text-center w-full bg-white py-2.5 rounded-lg font-mono text-sm text-slate-600 border border-slate-200/60 font-semibold truncate px-4 shadow-sm">
                    {generatedSet[compareIcons[0]].name}.svg
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center text-slate-300">
                  <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>
                </div>
                <div className="flex-1 flex flex-col items-center gap-5">
                  <div className="w-full aspect-square border border-slate-200/60 bg-white rounded-2xl p-10 flex items-center justify-center shadow-sm [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: generatedSet[compareIcons[1]].svg }}
                  />
                  <div className="text-center w-full bg-white py-2.5 rounded-lg font-mono text-sm text-slate-600 border border-slate-200/60 font-semibold truncate px-4 shadow-sm">
                    {generatedSet[compareIcons[1]].name}.svg
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-10 bg-white border-t border-slate-200/60 text-slate-500 text-xs flex items-center justify-center px-4 shrink-0 font-medium tracking-wide">
        IconNest Studio © 2026
      </footer>
    </div>
  );
}
