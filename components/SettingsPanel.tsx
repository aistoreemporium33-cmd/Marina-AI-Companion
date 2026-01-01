
import React from 'react';
import { Database, ShieldCheck, Heart, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SettingsPanel = () => {
  const { marinaProfile, longTermMemories } = useAppContext();

  return (
    <div className="h-full p-8 space-y-12 text-stone-200 overflow-y-auto custom-scrollbar">
      {/* Identity Section */}
      <section>
        <div className="flex items-center space-x-3 text-gold-400 mb-8 border-b border-burgundy-900/20 pb-4">
          <Heart className="w-5 h-5 fill-burgundy-900/40" />
          <h3 className="font-serif text-2xl tracking-wide">Über Marina</h3>
        </div>

        <div className="space-y-8">
          <div className="group">
            <label className="text-[12px] uppercase text-stone-500 font-bold tracking-[0.15em] mb-3 block">Manifestation</label>
            <div className="bg-stone-950/60 p-5 rounded-2xl text-[16px] font-body italic border border-stone-900/50 group-hover:border-burgundy-900/40 transition-all">
              {marinaProfile.name}
            </div>
          </div>
          <div className="group">
            <label className="text-[12px] uppercase text-stone-500 font-bold tracking-[0.15em] mb-3 block">Charakterzug</label>
            <div className="bg-stone-950/60 p-5 rounded-2xl text-[16px] font-body italic border border-stone-900/50 capitalize group-hover:border-burgundy-900/40 transition-all">
              {marinaProfile.trait}
            </div>
          </div>
        </div>
      </section>

      {/* Memory Section */}
      <section>
         <div className="flex items-center space-x-3 text-gold-400 mb-8 border-b border-burgundy-900/20 pb-4">
          <Database className="w-5 h-5" />
          <h3 className="font-serif text-2xl tracking-wide">Erinnerungen</h3>
        </div>
        
        <div className="bg-stone-950/40 rounded-2xl border border-stone-900/50 overflow-hidden">
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {longTermMemories.length > 0 ? (
              longTermMemories.map((mem, i) => (
                <div key={i} className="flex items-start text-[14px] leading-relaxed text-stone-300 p-5 border-b border-stone-900 last:border-0 hover:bg-stone-900/30 transition-colors">
                  <span className="mr-4 text-burgundy-600 text-lg">•</span>
                  <p className="font-body italic">{mem}</p>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-stone-600 text-[13px] italic font-body">
                Eure Geschichte beginnt gerade erst...
              </div>
            )}
          </div>
        </div>
        
        {!marinaProfile.isPremium && (
          <div className="mt-6 flex items-center gap-3 bg-burgundy-950/30 p-4 rounded-xl border border-burgundy-900/20">
            <ShieldCheck className="w-4 h-4 text-burgundy-500" />
            <p className="text-[11px] text-stone-400 font-bold uppercase tracking-wider leading-tight">
              Gedächtnis im Gast-Modus limitiert
            </p>
          </div>
        )}
      </section>

      {/* Version Info */}
      <div className="pt-10 border-t border-burgundy-900/10 text-center space-y-2 opacity-40">
        <div className="flex justify-center items-center gap-2 text-stone-500">
           <Info className="w-3 h-3" />
           <p className="text-[11px] font-bold uppercase tracking-widest">Marina 1.2 Pro Edition</p>
        </div>
        <p className="text-[10px] font-medium tracking-tight">Künstliche Intelligenz für intime Konversation</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(109, 37, 37, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
