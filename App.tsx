import React, { useState, useRef, useEffect } from 'react';
import { 
  Language, translations, PromptResult, OutputFormat, 
  MediaMode, PromptStyle, VideoDuration, PromptConfig 
} from './types';
import { analyzeMedia, generatePromptFromText } from './services/gemini';
import CopyButton from './components/CopyButton';

const DURATION_OPTIONS: VideoDuration[] = ['5s', '10s', '15s', '39s', '60s'];

const SAMPLE_IDEAS: Record<Language, string[]> = {
  [Language.INDONESIAN]: [
    "Iklan sinematik minuman kopi dingin artisan di pagi berkabut, tetesan embun, slow-motion 4K",
    "Pendekar cyberpunk bertarung di gang sempit neo-Tokyo saat hujan lebat dengan lampu neon ungu",
    "Astronot menjelajahi gua kristal bercahaya bioluminescent di planet alien yang misterius",
    "Video drone lanskap sinematik terbang melintasi kawah Gunung Bromo saat matahari terbit keemasan",
    "Dokumenter dramatis elang jawa berburu di kanopi hutan hujan tropis berkabut"
  ],
  [Language.ENGLISH]: [
    "Cinematic commercial for artisan cold brew coffee, condensation droplets, morning mist, 4K macro",
    "Cyberpunk samurai duel in a neon-lit Tokyo back-alley under heavy torrential rain",
    "Astronaut exploring a glowing bioluminescent crystal cavern on an uncharted alien world",
    "Cinematic drone shot flying through mountain peaks during golden sunrise with volumetric fog",
    "Epic cinematic trailer of a mechanical dragon awakening beneath a snow-covered fortress"
  ]
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.INDONESIAN);
  const [mode, setMode] = useState<MediaMode>(MediaMode.TEXT);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [config, setConfig] = useState<PromptConfig>({
    style: 'auto',
    strength: 0.4,
    faceConsistency: false,
    sceneDetection: true,
    sceneCount: 3,
    duration: '15s',
  });

  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<OutputFormat>(OutputFormat.TEXT);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleModeChange = (newMode: MediaMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const isVideo = selectedFile.type.startsWith('video/');
      if ((mode === MediaMode.IMAGE && !isImage) || (mode === MediaMode.VIDEO && !isVideo)) {
        setError(t.errors.wrongType);
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    setError(null);

    if (mode === MediaMode.TEXT) {
      if (!textInput.trim()) {
        setError(t.errors.noText);
        return;
      }
    } else {
      if (!file) {
        setError(t.errors.noMedia);
        return;
      }
    }

    setIsLoading(true);
    try {
      let data: PromptResult;
      if (mode === MediaMode.TEXT) {
        data = await generatePromptFromText(textInput.trim(), lang, config);
      } else {
        data = await analyzeMedia(file!, lang, config);
      }
      setResult(data);
      if (data.scenes && data.scenes.length > 0) {
        setActiveFormat(OutputFormat.SCENES);
      } else {
        setActiveFormat(OutputFormat.TEXT);
      }
    } catch (err: any) {
      console.error(err);
      setError(t.errors.apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([result.jsonPrompt], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${config.sceneCount}scenes_${config.duration}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetMedia = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formattedJsonOutput = () => {
    if (!result?.jsonPrompt) return '';
    try {
      const parsed = JSON.parse(result.jsonPrompt);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return result.jsonPrompt;
    }
  };

  const sampleIdeas = SAMPLE_IDEAS[lang];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } flex flex-col items-center p-4 md:p-8`}>
      
      {/* Header */}
      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 tracking-tight uppercase">
                {t.title}
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                v2.0
              </span>
            </div>
            <p className="text-xs font-medium opacity-60 tracking-normal">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className={`p-2.5 rounded-2xl border transition-all ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-indigo-600 shadow-sm hover:bg-slate-100'
            }`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
          
          {/* Language Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {(['id', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l as Language)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                  lang === l 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'opacity-50 hover:opacity-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Settings Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          <div className={`p-5 md:p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-5">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {t.settingsTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {config.sceneCount} {lang === Language.INDONESIAN ? 'Scene' : 'Scenes'} &bull; {config.duration}
              </span>
            </div>

            <div className="space-y-6">
              
              {/* OPSI 2: JUMLAH SCENE (1 - 10 SCENE) */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    {t.labels.sceneCount}
                  </label>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm">
                    {config.sceneCount} {lang === Language.INDONESIAN ? 'Scene' : 'Scenes'}
                  </span>
                </div>

                {/* Slider 1-10 */}
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={config.sceneCount}
                  onChange={(e) => setConfig({...config, sceneCount: parseInt(e.target.value, 10)})}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                {/* Quick Scene Number Buttons 1 to 10 */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mt-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfig({...config, sceneCount: num})}
                      className={`h-7 rounded-lg text-xs font-black transition-all ${
                        config.sceneCount === num
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 ring-2 ring-blue-400/50'
                          : theme === 'dark'
                            ? 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                            : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold opacity-40">
                  <span>1 Scene (Minimal)</span>
                  <span>10 Scene (Maksimal)</span>
                </div>
              </div>

              {/* OPSI 3: PILIHAN DURASI (5 s, 10 s, 15 s, 39 s, 60 s) */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.labels.duration}
                  </label>
                  <span className="text-[11px] font-bold text-indigo-300">
                    {t.durations[config.duration]}
                  </span>
                </div>

                {/* Duration chips: 5s, 10s, 15s, 39s, 60s */}
                <div className="grid grid-cols-5 gap-1.5">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setConfig({...config, duration: dur})}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center ${
                        config.duration === dur
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400/50'
                          : theme === 'dark'
                            ? 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                            : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      <span className="text-xs">{dur}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] opacity-40 font-medium">
                  {lang === Language.INDONESIAN 
                    ? `Waktu akan dialokasikan seimbang ke dalam ${config.sceneCount} scene.` 
                    : `Pacing will be distributed across ${config.sceneCount} scene(s).`}
                </p>
              </div>

              {/* Style Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-50">
                  {t.labels.style}
                </label>
                <select 
                  value={config.style}
                  onChange={(e) => setConfig({...config, style: e.target.value as PromptStyle})}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {(Object.keys(t.styles) as PromptStyle[]).map(style => (
                    <option key={style} value={style}>{t.styles[style]}</option>
                  ))}
                </select>
              </div>

              {/* Creativity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.labels.strength}</label>
                  <span className="text-[10px] font-black text-blue-500">{(config.strength * 10).toFixed(0)}/10</span>
                </div>
                <input 
                  type="range" min="0.1" max="1.0" step="0.1"
                  value={config.strength}
                  onChange={(e) => setConfig({...config, strength: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-1 text-[9px] font-bold opacity-30">
                  <span>{t.labels.precise}</span>
                  <span>{t.labels.creative}</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-800/60">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                    {t.labels.faceLock}
                  </span>
                  <input 
                    type="checkbox" checked={config.faceConsistency}
                    onChange={(e) => setConfig({...config, faceConsistency: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 checked:bg-blue-600 transition-all cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                    {t.labels.sceneDetection}
                  </span>
                  <input 
                    type="checkbox" checked={config.sceneDetection}
                    onChange={(e) => setConfig({...config, sceneDetection: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 checked:bg-blue-600 transition-all cursor-pointer"
                  />
                </label>
              </div>

            </div>
          </div>
        </aside>

        {/* Middle: Mode Selection & Input Area */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Mode Switch Tabs (1. BUAT PROMPT DARI TEKS, 2. GAMBAR, 3. VIDEO) */}
          <div className={`p-1 rounded-2xl flex border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300 shadow-sm'
          }`}>
            <button
              onClick={() => handleModeChange(MediaMode.TEXT)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all text-[11px] uppercase tracking-wider ${
                mode === MediaMode.TEXT ? 'bg-blue-600 text-white shadow-md' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.modes.text}
            </button>
            <button
              onClick={() => handleModeChange(MediaMode.IMAGE)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all text-[11px] uppercase tracking-wider ${
                mode === MediaMode.IMAGE ? 'bg-blue-600 text-white shadow-md' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t.modes.image}
            </button>
            <button
              onClick={() => handleModeChange(MediaMode.VIDEO)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all text-[11px] uppercase tracking-wider ${
                mode === MediaMode.VIDEO ? 'bg-blue-600 text-white shadow-md' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t.modes.video}
            </button>
          </div>

          {/* OPSI 1: INPUT TEKS MODE */}
          {mode === MediaMode.TEXT ? (
            <div className={`p-5 rounded-3xl border flex flex-col gap-4 flex-1 ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t.labels.textInputLabel}
                </label>
                {textInput && (
                  <button
                    onClick={() => setTextInput('')}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="relative flex-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.labels.textPlaceholder}
                  rows={6}
                  className={`w-full h-full min-h-[170px] p-4 rounded-2xl text-sm font-medium border resize-none outline-none leading-relaxed custom-scrollbar transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-950/90 border-slate-800 text-slate-100 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <div className="absolute bottom-3 right-3 text-[10px] font-mono opacity-40">
                  {textInput.length} chars
                </div>
              </div>

              {/* Quick Idea Inspiration Chips */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-2">
                  {t.labels.sampleIdeas}
                </span>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  {sampleIdeas.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTextInput(idea)}
                      className={`text-left text-xs p-2 rounded-xl transition-all border ${
                        theme === 'dark' 
                          ? 'bg-slate-950/50 hover:bg-slate-800/80 text-slate-300 border-slate-800/80 hover:border-blue-500/50' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="line-clamp-1">{idea}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* GAMBAR & VIDEO MEDIA MODE */
            <div 
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`group relative rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[280px] p-4 overflow-hidden flex-1 ${
                file 
                  ? 'border-blue-500/50 bg-blue-500/5' 
                  : theme === 'dark' 
                    ? 'border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/60' 
                    : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 shadow-sm'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept={mode === MediaMode.IMAGE ? "image/*" : "video/*"} 
              />
              
              {previewUrl ? (
                mode === MediaMode.IMAGE ? (
                  <img src={previewUrl} alt="Preview" className="max-h-[240px] w-auto object-contain rounded-xl animate-fade-in" />
                ) : (
                  <video src={previewUrl} className="max-h-[240px] w-full object-contain rounded-xl animate-fade-in" controls />
                )
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-60">{t.uploadLabel}</p>
                    <p className="text-[10px] opacity-40 mt-1">
                      {mode === MediaMode.IMAGE ? 'PNG, JPG, WEBP' : 'MP4, MOV, WEBM'}
                    </p>
                  </div>
                </div>
              )}
              
              {file && !isLoading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); resetMedia(); }}
                  className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || (mode === MediaMode.TEXT ? !textInput.trim() : !file)}
            className={`w-full py-4 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2.5 ${
              isLoading || (mode === MediaMode.TEXT ? !textInput.trim() : !file)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <span>{t.generateBtn}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20">
                  {config.sceneCount} Scenes &bull; {config.duration}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </section>

        {/* Right: Results Display */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Output Format Switcher */}
          <div className={`p-1 rounded-2xl flex border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
          }`}>
            <button
              onClick={() => setActiveFormat(OutputFormat.TEXT)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeFormat === OutputFormat.TEXT ? 'bg-blue-600 text-white shadow-md' : 'opacity-40 hover:opacity-80'
              }`}
            >
              {t.formats.text}
            </button>
            <button
              onClick={() => setActiveFormat(OutputFormat.SCENES)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeFormat === OutputFormat.SCENES ? 'bg-blue-600 text-white shadow-md' : 'opacity-40 hover:opacity-80'
              }`}
            >
              <span>{t.formats.scenes}</span>
              {result?.scenes && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center">
                  {result.scenes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFormat(OutputFormat.JSON)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeFormat === OutputFormat.JSON ? 'bg-blue-600 text-white shadow-md' : 'opacity-40 hover:opacity-80'
              }`}
            >
              {t.formats.json}
            </button>
          </div>

          {/* Results Container */}
          <div className={`flex-1 min-h-[460px] rounded-3xl p-5 relative flex flex-col border shadow-xl ${
            theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {!result && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest">
                  {lang === Language.INDONESIAN ? 'Siap Menghasilkan Prompt' : 'Ready for Generation'}
                </p>
                <p className="text-[11px] opacity-60 mt-1 max-w-xs">
                  {lang === Language.INDONESIAN 
                    ? `Pilih mode Teks atau Media, tentukan 1-10 scene (${config.sceneCount} scene) & durasi (${config.duration}).`
                    : `Choose Text or Media, set 1-10 scenes (${config.sceneCount} scenes) & duration (${config.duration}).`}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-400 animate-pulse">
                    Gemini AI Processing
                  </p>
                  <p className="text-[10px] opacity-40 mt-1 font-mono">
                    Constructing {config.sceneCount} scene(s) &bull; {config.duration}
                  </p>
                </div>
              </div>
            )}

            {result && !isLoading && (
              <div className="flex-1 flex flex-col animate-fade-in overflow-hidden">
                {/* Header Bar */}
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-100 border-slate-200 text-blue-600'
                    }`}>
                      {activeFormat === OutputFormat.TEXT 
                        ? 'Master Narrative' 
                        : activeFormat === OutputFormat.SCENES 
                          ? `${result.scenes?.length || config.sceneCount} Scenes Breakdown` 
                          : 'JSON Output'}
                    </span>
                    <span className="text-[9px] font-bold opacity-40">
                      {config.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeFormat === OutputFormat.JSON && (
                      <button 
                        onClick={downloadJson}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                        title={t.downloadLabel}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    <CopyButton 
                      text={
                        activeFormat === OutputFormat.TEXT 
                          ? result.textPrompt 
                          : activeFormat === OutputFormat.JSON 
                            ? formattedJsonOutput() 
                            : result.scenes 
                              ? result.scenes.map(s => `[SCENE ${s.sceneNumber} (${s.duration || config.duration})]\nCamera: ${s.cameraMovement}\nVisual: ${s.visualDescription}\nPrompt: ${s.prompt}`).join('\n\n')
                              : result.textPrompt
                      } 
                      label={lang === Language.INDONESIAN ? "Salin Semua" : "Copy All"} 
                      onCopy={t.copySuccess} 
                    />
                  </div>
                </div>

                {/* Content Body */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  {/* TAB 1: MASTER NARRATIVE PROMPT */}
                  {activeFormat === OutputFormat.TEXT && (
                    <div className="space-y-3">
                      <p className={`text-xs md:text-sm leading-relaxed font-medium whitespace-pre-line ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {result.textPrompt}
                      </p>
                    </div>
                  )}

                  {/* TAB 2: SCENES CARDS BREAKDOWN (1 - 10 SCENE) */}
                  {activeFormat === OutputFormat.SCENES && (
                    <div className="space-y-3.5">
                      {result.scenes && result.scenes.length > 0 ? (
                        result.scenes.map((scene, idx) => (
                          <div 
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              theme === 'dark' 
                                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
                                : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                                  {t.labels.sceneCard} {scene.sceneNumber}
                                </span>
                                {scene.duration && (
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {scene.duration}
                                  </span>
                                )}
                              </div>
                              <CopyButton text={scene.prompt || scene.visualDescription} label="" onCopy={t.copySuccess} />
                            </div>

                            {scene.cameraMovement && (
                              <div className="mb-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 opacity-80 block">
                                  {t.labels.camera}
                                </span>
                                <p className="text-[11px] font-medium opacity-80">
                                  {scene.cameraMovement}
                                </p>
                              </div>
                            )}

                            <div className="mb-2">
                              <span className="text-[9px] font-black uppercase tracking-wider opacity-40 block">
                                Visual Action
                              </span>
                              <p className={`text-xs leading-relaxed font-normal ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {scene.visualDescription}
                              </p>
                            </div>

                            {scene.prompt && (
                              <div className={`p-2.5 rounded-xl border mt-2 ${
                                theme === 'dark' ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                                  {t.labels.copyScene}
                                </span>
                                <p className="text-xs font-mono text-emerald-300 leading-relaxed break-words">
                                  {scene.prompt}
                                </p>
                              </div>
                            )}

                            {scene.audioOrDialogue && (
                              <div className="mt-2 text-[10px] opacity-60 flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                <span>{scene.audioOrDialogue}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 opacity-40 text-xs">
                          {lang === Language.INDONESIAN 
                            ? 'Adegan tertera dalam Prompt Master. Beralih ke tab Prompt Teks.' 
                            : 'Scene breakdown available in Master Prompt tab.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: JSON PROMPT */}
                  {activeFormat === OutputFormat.JSON && (
                    <pre className="text-[11px] font-mono text-blue-400 leading-relaxed whitespace-pre-wrap break-words">
                      {formattedJsonOutput()}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 flex flex-col items-center gap-3 w-full border-t border-slate-900/50">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center">
          AI Scene &bull; Multi-Scene (1-10) &bull; Durations (5s - 60s) &bull; Gemini 3.8
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold opacity-50">
          <span>&copy; {new Date().getFullYear()} Remix: Explore AI Prompt</span>
        </div>
      </footer>

      {/* Embedded Custom Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${theme === 'dark' ? '#334155' : '#cbd5e1'}; 
          border-radius: 12px; 
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 4px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #2563eb;
          margin-top: -5px;
          box-shadow: 0 0 10px rgba(37,99,235,0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default App;
