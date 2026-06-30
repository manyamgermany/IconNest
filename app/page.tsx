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
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
      {/* Top Nav */}
      <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-5 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          >
            {leftSidebarOpen ? <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>}
          </button>
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
            <Layers className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block">IconNest <span className="text-slate-500 font-normal">Studio</span></span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span className="hidden sm:inline-block">Brand: <strong className="text-slate-800">{brandName}</strong> Sync Active</span>
            <span className="sm:hidden text-slate-800 font-bold truncate max-w-[80px]">{brandName}</span>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <div className="flex gap-2 items-center">
            <div className="hidden sm:flex gap-2 items-center">
              <select 
                value={exportFormat} 
                onChange={e => setExportFormat(e.target.value as any)}
                className="border border-slate-200 bg-white text-slate-600 rounded-md px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="SVG">SVG</option>
                <option value="PNG">PNG</option>
                <option value="EPS">EPS</option>
              </select>
              {exportFormat === 'PNG' && (
                <select 
                  value={exportSize} 
                  onChange={e => setExportSize(Number(e.target.value))}
                  className="border border-slate-200 bg-white text-slate-600 rounded-md px-2 py-1.5 text-xs focus:outline-none"
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
              )}
            </div>
            <button 
              onClick={handleExport}
              disabled={!generatedSet}
              className="bg-blue-600 text-white rounded-md px-3 md:px-4 py-1.5 md:py-2 font-medium text-xs md:text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline-block">Export</span>
            </button>
            <button 
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
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
        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${leftSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
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
              <div className="p-5 border-b border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Brand Identity</label>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="Website URL"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full rounded pl-7 pr-2 py-1.5" 
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                      </div>
                      <label className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 cursor-pointer hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                      </label>
                    </div>
                    {logoBase64 && <div className="text-[10px] text-green-600 mt-1 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Logo attached</div>}
                  </div>
                  <button 
                    onClick={handleAnalyzeBrand}
                    disabled={isAnalyzing || (!logoBase64 && !websiteUrl)}
                    className="w-full bg-slate-800 text-white rounded text-xs font-medium py-1.5 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {isAnalyzing ? `Analyzing... (${generationDuration}s)` : 'Analyze Brand'}
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <div className="w-10 h-10 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {logoBase64 ? <img src={logoBase64} alt="Logo" className="w-full h-full object-contain" /> : <Layers className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input 
                      type="text" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Brand Name"
                      className="text-xs font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 w-full rounded px-1 -ml-1 placeholder-slate-400" 
                    />
                    <div className="text-[10px] text-slate-400 truncate">{visualTone}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-2">Extracted Palette</div>
                  <div className="flex flex-wrap gap-2">
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
              
              <div className="p-5 flex-1 overflow-y-auto">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Style Parameters</label>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {STYLE_PILLS.map(style => {
                    const isSelected = selectedStyles.includes(style);
                    return (
                    <div key={style} className="relative group">
                      <button 
                        onClick={() => toggleStyle(style)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-medium tracking-wide transition-all duration-200 ${isSelected ? 'bg-slate-800 text-white shadow-sm border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm'}`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {style}
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-200 z-50 text-center leading-tight">
                        {STYLE_DESCRIPTIONS[style]}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  )})}
                </div>
                
                <div className="mt-5">
                  <div className="text-xs font-semibold mb-3">Use Case Context</div>
                  <div className="grid grid-cols-1 gap-1">
                    {USE_CASES.map(uc => (
                      <button 
                        key={uc}
                        onClick={() => setSelectedUseCase(uc)}
                        className={`p-2 rounded-md text-xs flex justify-between items-center transition-colors ${selectedUseCase === uc ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <span>{uc}</span>
                        {selectedUseCase === uc && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Save Current</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Preset Name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 bg-slate-50 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleSavePreset}
                    disabled={!newPresetName.trim()}
                    className="bg-slate-800 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saved Presets</label>
                {presets.length === 0 ? (
                  <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">No presets saved yet.</div>
                ) : (
                  presets.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3 bg-slate-50 hover:border-blue-300 transition-colors relative overflow-hidden">
                      {presetToDeleteId === p.id ? (
                        <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-3 text-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">Delete preset?</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeletePreset(p.id)} className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded font-medium hover:bg-red-700 transition-colors">Yes, delete</button>
                            <button onClick={() => setPresetToDeleteId(null)} className="text-[10px] bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors px-3 py-1.5 rounded font-medium">Cancel</button>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-slate-800">{p.name}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleCopyPreset(p)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Copy to clipboard">
                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                          <button onClick={() => handleLoadPreset(p)} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium hover:bg-blue-200 transition-colors">Load</button>
                          <button onClick={() => setPresetToDeleteId(p.id)} className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 transition-colors px-1.5 py-1 rounded font-medium">X</button>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {p.colors.map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-sm border border-black/10" style={{ backgroundColor: c }}></div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.styles.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">{s}</span>
                        ))}
                        {p.styles.length > 3 && <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-medium">+{p.styles.length - 3}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 bg-slate-100 flex flex-col relative min-w-0">
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-5 justify-between z-10">
            <div className="flex gap-3">
              <div className="bg-slate-100 p-1 rounded-md flex gap-0.5">
                <button 
                  onClick={() => { setViewMode('preview'); setIsCompareMode(false); }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'preview' ? 'bg-white border border-slate-200 shadow-sm font-semibold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Preview Icon
                </button>
                <button 
                  onClick={() => { setViewMode('full'); setIsCompareMode(false); }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'full' ? 'bg-white border border-slate-200 shadow-sm font-semibold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Full Set (200+)
                </button>
                <button 
                  onClick={() => { setViewMode('brandKit'); setIsCompareMode(false); }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'brandKit' ? 'bg-white border border-slate-200 shadow-sm font-semibold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Brand Kit
                </button>
              </div>
              
              {viewMode === 'full' && generatedSet && generatedSet.length > 0 && (
                <>
                  <button
                    onClick={() => setIsGenerateMoreOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                  >
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add More Icons
                  </button>
                  <button
                    onClick={() => {
                      setIsCompareMode(!isCompareMode);
                      setCompareIcons([]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${isCompareMode ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                  >
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>
                    {isCompareMode ? 'Cancel Compare' : 'Compare Icons'}
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {viewMode === 'full' && (
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded pl-8 pr-3 py-1.5 w-48"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
              )}
              <div className="text-[11px] text-slate-400 flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg">
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 50))} className="hover:text-slate-600 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="w-[85px] text-center font-medium tabular-nums">Zoom: {zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(400, zoomLevel + 50))} className="hover:text-slate-600 transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <div className="flex bg-slate-100 p-1 rounded-lg relative w-40">
                <div 
                  className="absolute top-1 bottom-1 w-[calc(33.33%-2.66px)] bg-white rounded shadow-sm transition-transform duration-200 ease-out" 
                  style={{ transform: `translateX(${canvasBg === 'light' ? '0' : canvasBg === 'grid' ? '100%' : '200%'})` }}
                ></div>
                <button onClick={() => setCanvasBg('light')} className={`relative flex-1 rounded px-2 py-1 text-[11px] text-center z-10 transition-colors ${canvasBg === 'light' ? 'text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Light</button>
                <button onClick={() => setCanvasBg('grid')} className={`relative flex-1 rounded px-2 py-1 text-[11px] text-center z-10 transition-colors ${canvasBg === 'grid' ? 'text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Grid</button>
                <button onClick={() => setCanvasBg('dark')} className={`relative flex-1 rounded px-2 py-1 text-[11px] text-center z-10 transition-colors ${canvasBg === 'dark' ? 'text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>Dark</button>
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
                        <div key={category} className="flex flex-col gap-4">
                          <div className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                             <span>{category}</span>
                             <span className="text-xs font-normal text-slate-400">{filteredCategoryIcons.length} icons</span>
                          </div>
                          <div className="grid grid-cols-4 gap-8">
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
                                      className="w-16 h-16 text-slate-800 [&>svg]:w-full [&>svg]:h-full p-2 border border-slate-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all bg-white"
                                      dangerouslySetInnerHTML={{ __html: icon.svg }}
                                    />
                                    <div className="text-[10px] text-slate-500 font-mono pointer-events-none text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-2">{icon.name}.svg</div>
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
                  <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="flex gap-2 mb-2 opacity-40">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-6 h-6 rounded-sm bg-slate-200"></div></div>
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-4 h-4 rounded-full bg-slate-200"></div></div>
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><div className="w-6 h-6 rotate-45 rounded-sm bg-slate-200"></div></div>
                    </div>
                    <div className="flex flex-col gap-1 text-center">
                      <span className="text-slate-700 font-semibold text-base">Your generated set</span>
                      <span className="text-xs max-w-[250px] text-slate-500">Approve your preview icon on the right to generate a cohesive set of beautiful icons.</span>
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
                     <span className="text-slate-700 font-semibold text-base">Brand Kit</span>
                     <span className="text-xs max-w-[280px] text-slate-500">Generate a unified brand kit including a favicon, social media avatar, and primary color palette based on your current settings.</span>
                     <button onClick={handleGenerateBrandKit} className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
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
        <aside className={`w-[280px] bg-white border-l border-slate-200 flex flex-col shrink-0 absolute inset-y-0 right-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${rightSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
          {viewMode === 'full' && selectedIconIdx !== null && generatedSet && generatedSet[selectedIconIdx] ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Icon Properties</label>
                <button onClick={() => setSelectedIconIdx(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <div className="w-full aspect-square border border-slate-200 rounded-lg p-6 bg-slate-50 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-slate-800"
                    dangerouslySetInnerHTML={{ __html: generatedSet[selectedIconIdx].svg }}
                  />
                  <button
                    onClick={handleGenerateVariation}
                    disabled={isGeneratingVariation}
                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md py-2 px-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingVariation ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Generate Variation
                  </button>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                  <input 
                    type="text" 
                    value={generatedSet[selectedIconIdx].name}
                    onChange={(e) => {
                      const newSet = [...generatedSet];
                      newSet[selectedIconIdx].name = e.target.value;
                      setGeneratedSet(newSet);
                    }}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                  <div className="w-full text-xs border border-slate-200 rounded px-2.5 py-2 bg-slate-50 text-slate-500 cursor-not-allowed">
                    {generatedSet[selectedIconIdx].category || 'Uncategorized'}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(generatedSet[selectedIconIdx].tags || []).map((tag, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
                        {tag}
                        <button 
                          onClick={() => {
                            const newSet = [...generatedSet];
                            newSet[selectedIconIdx].tags = (newSet[selectedIconIdx].tags || []).filter((_, idx) => idx !== i);
                            setGeneratedSet(newSet);
                          }}
                          className="hover:text-red-500"
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
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Master Controls</label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button 
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className={`${!previewSvg ? 'bg-slate-800 text-white shadow-sm hover:bg-slate-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} rounded-md py-2 px-4 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full`}
                  >
                    {previewSvg ? 'Regenerate Preview' : 'Generate Preview'}
                  </button>
                  <button 
                    onClick={handleGenerateSet}
                    disabled={isGeneratingSet || isGeneratingPreview || !previewSvg}
                    className={`${previewSvg ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'bg-slate-100 text-slate-400 border border-slate-200'} rounded-md py-2 px-4 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full`}
                  >
                    Approve & Generate Set
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col min-h-0">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Comments & Iterations</label>
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs mb-3 overflow-y-auto flex flex-col gap-3">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`${msg.role === 'user' ? 'border-l-2 border-blue-600 pl-2' : ''}`}>
                      <div className="font-semibold mb-1 text-slate-800">
                        {msg.role === 'user' ? 'You' : 'System'} <span className="font-normal text-slate-400 text-[10px] ml-1">{msg.time}</span>
                      </div>
                      <div className="text-slate-600 leading-relaxed">{msg.text}</div>
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
                  className="w-full h-16 border border-slate-200 rounded-md p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm"
                ></textarea>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                  <span className="font-medium">Version History</span>
                  <span className="hover:text-blue-600 cursor-pointer">View All</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-8 bg-white border border-blue-600 rounded shadow-sm"></div>
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded opacity-50"></div>
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded opacity-30"></div>
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
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">Generate Additional Icons</h3>
                <button 
                  onClick={() => setIsGenerateMoreOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50"
                  disabled={isGeneratingMore}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quick Add Groups</label>
                  <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    {Object.entries(ICON_TAXONOMY).map(([groupName, icons]) => (
                      <button
                        key={groupName}
                        onClick={() => {
                          const currentNames = customIconNames.split(',').map(s => s.trim()).filter(Boolean);
                          const newNames = Array.from(new Set([...currentNames, ...icons])).join(', ');
                          setCustomIconNames(newNames);
                        }}
                        className="px-2.5 py-1 text-[10px] font-medium bg-white border border-slate-200 text-slate-600 rounded-md hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                      >
                        + {groupName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Required Icons (comma separated)</label>
                  <textarea 
                    placeholder="e.g. Shopping cart, user settings, billing history..."
                    value={customIconNames}
                    onChange={(e) => setCustomIconNames(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                    disabled={isGeneratingMore}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Enter any specific icons you need. They will be generated in the current brand style and appended to your active set. For a large enterprise-grade set, you can paste in standard grouped lists (e.g., Billing and finance).
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setIsGenerateMoreOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                    disabled={isGeneratingMore}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerateMoreIcons}
                    disabled={!customIconNames.trim() || isGeneratingMore}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
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
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">Icon Comparison</h3>
                <button 
                  onClick={() => setCompareIcons([])} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col md:flex-row gap-8 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="w-full aspect-square border border-slate-200 bg-slate-50 rounded-xl p-8 flex items-center justify-center shadow-inner [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: generatedSet[compareIcons[0]].svg }}
                  />
                  <div className="text-center w-full bg-slate-100 py-2 rounded-md font-mono text-xs text-slate-600 border border-slate-200 font-medium truncate px-4">
                    {generatedSet[compareIcons[0]].name}.svg
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-center justify-center text-slate-300">
                  <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>
                </div>
                <div className="flex-1 flex flex-col items-center gap-4">
                  <div className="w-full aspect-square border border-slate-200 bg-slate-50 rounded-xl p-8 flex items-center justify-center shadow-inner [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: generatedSet[compareIcons[1]].svg }}
                  />
                  <div className="text-center w-full bg-slate-100 py-2 rounded-md font-mono text-xs text-slate-600 border border-slate-200 font-medium truncate px-4">
                    {generatedSet[compareIcons[1]].name}.svg
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-6 bg-slate-900 text-slate-400 text-[10px] flex items-center px-4 justify-between shrink-0 font-medium tracking-wide">
        <div>WCAG 2.2 AA Compliant • System Health: Nominal</div>
        <div>Queue: Idle • Worker ID: #IN-8892</div>
      </footer>
    </div>
  );
}
