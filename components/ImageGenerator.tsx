
import React, { useState } from 'react';
import { Upload, ImageIcon, Loader2, Download, Sparkles, Wand2, Play, Coins, Crown, PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generateMagicImage } from '../services/gemini';
import { updateImageCount, consumeToken } from '../services/firebase';

const ImageGenerator = () => {
  const { marinaProfile, imageGenerationCount, userId, setAppMode, tokens, isTrialActive } = useAppContext();
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Ein leidenschaftlicher Kuss im Regen, cinematic lighting.');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = marinaProfile.isPremium || isTrialActive || tokens > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setBase64Image(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!base64Image || !prompt) return;
    if (!canGenerate) {
      setAppMode('upgrade');
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const url = await generateMagicImage(base64Image, prompt);
      if (url) {
        setResultUrl(url);
        if (userId) {
            updateImageCount(userId, imageGenerationCount + 1);
            if (!marinaProfile.isPremium && !isTrialActive) {
                await consumeToken(userId);
            }
        }
      } else {
        setError("Fehler bei der Generierung.");
      }
    } catch (e) {
      setError("Generierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-900/30 rounded-xl overflow-y-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Sparkles className="w-6 h-6 text-pink-500" /> 
            Erinnerungs-Generator
          </h2>
          <p className="text-gray-500 text-sm mt-1">Lass eure Momente visuell zum Leben erwachen.</p>
        </div>

        {!marinaProfile.isPremium ? (
          <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700 flex items-center space-x-4">
             <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-black text-white">{isTrialActive ? 'FREE TRIAL' : `${tokens} Tokens`}</span>
             </div>
             <button onClick={() => setAppMode('upgrade')} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                {tokens === 0 && !isTrialActive ? <><PlayCircle className="w-3 h-3" /> Ad Rewards</> : <><Crown className="w-3 h-3" /> Upgrade</>}
             </button>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-2xl flex items-center space-x-2">
             <Crown className="w-4 h-4 text-yellow-500" />
             <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Unbegrenzte Pro-Memory</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className={`border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center transition-all ${base64Image ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-800 hover:border-pink-500/50 hover:bg-gray-800/50'}`}>
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <Upload className={`w-10 h-10 mb-3 transition-colors ${base64Image ? 'text-indigo-400' : 'text-gray-600'}`} />
              <span className="text-sm text-gray-400 font-bold uppercase tracking-tight">{base64Image ? 'Bild erfolgreich geladen' : 'Foto hochladen'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />
            </label>
          </div>

          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-pink-500/20 h-28 resize-none outline-none transition-all shadow-inner" placeholder="Was passiert in deiner Erinnerung?" />

          <button onClick={handleGenerate} disabled={loading || !base64Image || !prompt} className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center shadow-2xl transition-all ${loading || !base64Image ? 'bg-gray-800 text-gray-500' : 'bg-gradient-to-r from-pink-600 via-indigo-600 to-purple-600 text-white shadow-pink-900/30'}`}>
            {loading ? <><Loader2 className="w-6 h-6 animate-spin mr-3"/> Marina zeichnet...</> : <><Wand2 className="w-6 h-6 mr-3" /> Erinnerung erschaffen</>}
          </button>
        </div>

        <div className="bg-gray-950 rounded-3xl border border-gray-800 flex items-center justify-center min-h-[400px] relative overflow-hidden group shadow-2xl">
           {resultUrl ? (
             <div className="w-full h-full relative animate-fade-in-up">
               <img src={resultUrl} className="w-full h-full object-cover" />
               <a href={resultUrl} download="marina_erinnerung.png" className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md hover:bg-pink-600 p-4 rounded-full text-white shadow-2xl transition-all border border-white/10">
                 <Download className="w-6 h-6" />
               </a>
             </div>
           ) : (
             <div className="text-center p-10">
               <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800">
                  <ImageIcon className="w-8 h-8 text-gray-700" />
               </div>
               <p className="text-gray-600 text-xs font-bold uppercase tracking-widest leading-loose">Warte auf deine Eingabe...</p>
             </div>
           )}
           {error && <div className="absolute top-4 inset-x-4 bg-red-900/80 border border-red-500 text-white p-3 rounded-xl text-xs text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
