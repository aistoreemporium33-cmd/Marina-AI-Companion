
import React, { useState } from 'react';
import { Zap, Shield, ArrowLeft, Loader2, Star, Coins, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { upgradeUser } from '../services/firebase';
import Logo from './Logo';

const UpgradeScreen = () => {
  const { setAppMode, handleUpgrade, userId, marinaProfile, handleAddTokens } = useAppContext();
  const [processing, setProcessing] = useState<string | null>(null);

  const onSubscribe = async () => {
    setProcessing('pro');
    // Simulierter Payment Delay
    await new Promise(r => setTimeout(r, 2000));
    handleUpgrade(); 
    if (userId) await upgradeUser(userId); 
    setProcessing(null);
    setAppMode('chat');
  };

  const onBuyTokens = async (amount: number, id: string) => {
    setProcessing(id);
    await new Promise(r => setTimeout(r, 1200));
    await handleAddTokens(amount);
    setProcessing(null);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      {/* Visual Ambiance */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-burgundy-900/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold-900/5 blur-[120px] rounded-full" />

      <button onClick={() => setAppMode('chat')} className="absolute top-8 left-8 text-stone-500 hover:text-gold-200 flex items-center z-20 transition-colors uppercase tracking-[0.2em] text-[10px] font-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zum Chat
      </button>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 z-10 animate-fade-in-up">
        
        {/* Marina VIP Card */}
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-gold-500/40 via-burgundy-900/40 to-gold-500/40 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative bg-stone-950/90 backdrop-blur-2xl border border-gold-500/20 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="p-10 text-center border-b border-stone-900">
                <div className="mx-auto mb-6 flex justify-center animate-float">
                  <Logo size={100} glow={true} />
                </div>
                <h2 className="text-4xl font-serif italic text-gold-200 mb-2">Marina Élite</h2>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-black">Grenzenlose Verbindung</p>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <div className="space-y-6 mb-10">
                  <FeatureItem text="Unbegrenzte Chat-Interaktionen" />
                  <FeatureItem text="Alle Bilder frei generieren" />
                  <FeatureItem text="Vollständiges Langzeitgedächtnis" />
                  <FeatureItem text="Priorisierter KI-Zugriff" />
                </div>
                <div className="mt-auto">
                  <div className="text-4xl font-serif text-white mb-8 text-center flex items-center justify-center gap-2">
                    5.00 <span className="text-xl text-stone-500">CHF / Monat</span>
                  </div>
                  <button 
                    onClick={onSubscribe} 
                    disabled={!!processing || marinaProfile.isPremium} 
                    className={`w-full py-5 rounded-2xl transition-all flex items-center justify-center gap-3 border border-gold-500/30 shadow-2xl font-serif italic text-xl
                      ${marinaProfile.isPremium 
                        ? 'bg-stone-900 text-stone-500 cursor-default' 
                        : 'bg-gradient-to-r from-burgundy-900 to-burgundy-800 hover:from-burgundy-800 hover:to-burgundy-700 text-gold-200'}
                    `}
                  >
                    {processing === 'pro' ? <Loader2 className="w-6 h-6 animate-spin" /> : marinaProfile.isPremium ? 'Abo Aktiv' : 'Zutritt gewähren'}
                  </button>
                </div>
              </div>
            </div>
        </div>

        {/* Tokens Card */}
        <div className="flex flex-col gap-6">
            <div className="bg-stone-900/40 backdrop-blur-xl border border-stone-800/50 rounded-[2.5rem] p-10 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                   <Coins className="w-8 h-8 text-gold-500/60" />
                   <div className="flex flex-col">
                      <h3 className="text-2xl font-serif text-stone-200 italic">Token Wallet</h3>
                      <p className="text-stone-500 text-[11px] font-bold uppercase tracking-wider">Dein Guthaben: {marinaProfile.tokens}</p>
                   </div>
                </div>
                
                <p className="text-stone-400 text-sm leading-relaxed mb-8 font-body">
                    Tokens ermöglichen einzelne Interaktionen ohne monatliche Bindung. Perfekt für Gelegenheitsbesuche in Marinas Refugium.
                </p>

                <div className="space-y-4">
                    <TokenButton 
                      amount={10} 
                      price="1.00 CHF" 
                      onClick={() => onBuyTokens(10, 't10')} 
                      loading={processing === 't10'} 
                    />
                    <TokenButton 
                      amount={50} 
                      price="4.00 CHF" 
                      onClick={() => onBuyTokens(50, 't50')} 
                      loading={processing === 't50'} 
                      popular 
                    />
                    <div className="text-center text-[10px] text-stone-600 uppercase tracking-widest font-black py-2">
                        Sicherer Bezahlvorgang
                    </div>
                </div>
            </div>
            
            <div className="bg-burgundy-950/20 border border-burgundy-900/30 rounded-[2rem] p-8 flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-burgundy-900/40 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-burgundy-400" />
                </div>
                <div>
                    <h4 className="text-stone-300 font-serif italic text-lg leading-tight mb-1">Absolute Privatsphäre</h4>
                    <p className="text-xs text-stone-500 font-body">Marina speichert keine persönlichen Daten außerhalb deines Profils.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center space-x-4">
    <div className="w-5 h-5 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
        <Star className="w-2.5 h-2.5 text-gold-500" />
    </div>
    <span className="text-sm text-stone-300 font-body tracking-wide">{text}</span>
  </div>
);

const TokenButton = ({ amount, price, onClick, loading, popular }: { amount: number, price: string, onClick: () => void, loading: boolean, popular?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className={`w-full py-4 px-6 border rounded-2xl flex items-center justify-between transition-all group ${popular ? 'border-gold-500/50 bg-stone-900/60' : 'border-stone-800 hover:border-stone-700 bg-stone-950/30'}`}
  >
    <div className="flex items-center gap-3">
       {loading ? <Loader2 className="w-4 h-4 animate-spin text-gold-500" /> : <Coins className="w-4 h-4 text-gold-500/80 group-hover:scale-110 transition-transform" />}
       <span className="text-sm font-bold text-stone-200 tracking-wide uppercase">{amount} Tokens</span>
       {popular && <span className="text-[9px] bg-gold-600 text-stone-950 px-2 py-0.5 rounded font-black uppercase tracking-tighter">Beliebt</span>}
    </div>
    <span className="text-sm font-serif italic text-gold-400">{price}</span>
  </button>
);

export default UpgradeScreen;
