import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Download, RefreshCw, Loader2, History, Settings2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const MOODS = ['Rage', 'Shock', 'Excitement', 'Victory', 'Esports Focus'];

interface GeneratedThumbnail {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export function ThumbnailGenerator() {
  const [gameName, setGameName] = useState('');
  const [concept, setConcept] = useState('');
  const [customText, setCustomText] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [autoText, setAutoText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<GeneratedThumbnail | null>(null);
  const [history, setHistory] = useState<GeneratedThumbnail[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  } as any);

  const generateThumbnail = async () => {
    if (!faceImage) {
      alert("Please upload a face image first.");
      return;
    }

    setIsGenerating(true);
    try {
      // Create a fresh instance using the default environment API key
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const base64Data = faceImage.split(',')[1];
      const mimeType = faceImage.split(';')[0].split(':')[1];

      const LIGHTING_STYLES = ['neon', 'fire/explosive', 'dark/moody', 'cinematic studio', 'god rays', 'cyberpunk glow'];
      const COLOR_TONES = ['warm/orange-teal', 'cold/blue-purple', 'high contrast vivid', 'desaturated gritty', 'toxic green/yellow'];
      const COMPOSITIONS = ['left focus face, right focus action', 'right focus face, left focus action', 'extreme close-up face with background action', 'low angle heroic shot'];
      const CAMERA_ANGLES = ['low angle', 'dutch angle (tilted)', 'wide angle perspective distortion', 'fisheye subtle', 'zoom burst effect'];

      const randomLighting = LIGHTING_STYLES[Math.floor(Math.random() * LIGHTING_STYLES.length)];
      const randomColor = COLOR_TONES[Math.floor(Math.random() * COLOR_TONES.length)];
      const randomComp = COMPOSITIONS[Math.floor(Math.random() * COMPOSITIONS.length)];
      const randomAngle = CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)];

      const textPrompt = `You are an advanced AI system that generates COMPLETE YouTube gaming thumbnails with strict control over composition, identity, and styling.

INPUT:
Game: ${gameName || 'popular video game'}
Concept: ${concept || 'epic gaming moment'}
Emotion: ${mood}
Text: ${autoText ? (customText || 'EPIC WIN') : 'NONE'}

STRICT GENERATION RULES:
- The thumbnail MUST follow the concept EXACTLY.
- Do NOT add unrelated objects or random elements.
- Background must be CLEAN, relevant, and game-specific.
- Every generation must be UNIQUE (no repetition).
- Style Engine: Use ${randomLighting} lighting, ${randomColor} color tone, ${randomComp} composition, and ${randomAngle} camera angle.

BACKGROUND CONTROL:
- Generate ONLY scene elements related to the concept.
- No mixed or messy objects.
- Use cinematic composition (clear subject separation).
- Maintain depth (foreground, midground, background).

FACE + BODY CONTROL:
- Use the provided user's face EXACTLY (no identity change).
- Face must be sharp, realistic, and consistent.
- Body + clothes MUST match gaming theme: gaming hoodie / esports outfit / casual streamer look.
- Expression must match emotion: ${mood}.
- Face must blend naturally with lighting.

STREAMER STYLE:
- Add gaming headphones on the character.
- Add subtle gaming setup vibe (RGB light, glow).
- Make it look like a LIVE STREAM moment.

TEXT CONTROL:
- ${autoText ? `Include the text "${customText || 'EPIC WIN'}" using bold, readable, high contrast 3D fonts.` : 'DO NOT INCLUDE ANY TEXT.'}
- Position text away from the face.

MULTI-STEP PIPELINE (MANDATORY):
1. Generate clean background scene (based on concept)
2. Generate body with correct pose + outfit
3. Overlay user face (identity locked)
4. Apply lighting + effects
5. Add text

DO NOT:
- Do not distort face
- Do not mix unrelated objects
- Do not create cluttered background
- Do not ignore concept

OUTPUT:
1280x720, ultra sharp, high contrast, YouTube-ready thumbnail.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: textPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newThumb: GeneratedThumbnail = {
          id: Math.random().toString(36).substring(7),
          url: imageUrl,
          prompt: textPrompt,
          timestamp: Date.now(),
        };
        setCurrentThumbnail(newThumb);
        setHistory(prev => [newThumb, ...prev].slice(0, 5));
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("An error occurred during generation. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentThumbnail) return;
    const a = document.createElement('a');
    a.href = currentThumbnail.url;
    a.download = `thumbnail-${currentThumbnail.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">AI Thumbnail Forge</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <h2 className="font-medium text-lg">Generation Settings</h2>
            </div>

            <div className="space-y-5">
              {/* Face Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Your Face (Required)</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                    ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}
                    ${faceImage ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                >
                  <input {...getInputProps()} />
                  {faceImage ? (
                    <div className="flex flex-col items-center">
                      <img src={faceImage} alt="Face preview" className="w-24 h-24 object-cover rounded-full border-2 border-zinc-700 mb-3 shadow-lg" />
                      <p className="text-sm text-emerald-400 font-medium">Image loaded. Click to change.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Upload className="w-8 h-8 mb-3" />
                      <p className="text-sm font-medium mb-1">Drag & drop your face here</p>
                      <p className="text-xs">or click to browse files</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Game Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Game Name (Optional)</label>
                <input 
                  type="text" 
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g. Valorant, Minecraft, Elden Ring"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                />
              </div>

              {/* Concept */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Scene Concept / Idea</label>
                <textarea 
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g. 1v5 clutch moment, finding rare loot, getting jumpscared"
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Mood Selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Expression / Mood</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${mood === m 
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Text Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="text-sm font-medium text-zinc-300">Include 3D Text</label>
                  <p className="text-xs text-zinc-500">Add bold, high-CTR text</p>
                </div>
                <button 
                  onClick={() => setAutoText(!autoText)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                    ${autoText ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${autoText ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Custom Text Input */}
              {autoText && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="text" 
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. INSANE WIN! (Leave blank for AI choice)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateThumbnail}
                disabled={isGenerating || !faceImage}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                  ${isGenerating 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : !faceImage 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Forging Thumbnail...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Thumbnail
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Area - Preview & History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Preview Panel */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-medium text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                Preview
              </h2>
              {currentThumbnail && (
                <div className="flex gap-2">
                  <button 
                    onClick={generateThumbnail}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Download HD
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center relative group">
              {currentThumbnail ? (
                <img 
                  src={currentThumbnail.url} 
                  alt="Generated Thumbnail" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-zinc-600 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium">No thumbnail generated yet</p>
                  <p className="text-sm mt-1 opacity-70">Upload your face and click Generate to start</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-indigo-400 font-medium animate-pulse">Applying cinematic effects...</p>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-zinc-400" />
                <h3 className="font-medium text-zinc-300">Recent Generations</h3>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {history.map((thumb) => (
                  <button 
                    key={thumb.id}
                    onClick={() => setCurrentThumbnail(thumb)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                      ${currentThumbnail?.id === thumb.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <img src={thumb.url} alt="History" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
