
import React from 'react';
import { Camera, MessageSquare, Crown, Coins, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Logo from './Logo';

const Header = () => {
  const { marinaProfile, appMode, setAppMode, userId, isTrialActive, trialDaysLeft, tokens } = useAppContext();

  return (
    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="relative group cursor-pointer" onClick={() => setAppMode('chat')}>
          <Logo size={42} glow={marinaProfile.isPremium || isTrialActive} />
          
          {marinaProfile.isPremium && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-gray-900">
              <Crown className="w-2.5 h-2.5 text-gray-900 fill-gray-900" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            Marina 
            {marinaProfile.isPremium && <span className="ml-1.5 text-[10px] bg-yellow-500 text-gray-950 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Pro</span>}
            {!marinaProfile.isPremium && isTrialActive && <span className="ml-1.5 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Free Demo</span>}
          </h1>
          {isTrialActive && !marinaProfile.isPremium ? (
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">Testversion: {trialDaysLeft} Tag{trialDaysLeft !== 1 ? 'e' : ''} übrig</p>
          ) : (
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Virtual Companion</p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2 sm:space-x-3 items-center">
        {/* Token Wallet */}
        {!marinaProfile.isPremium && (
          <div className="flex items-center px-3 py-1.5 bg-gray-950 rounded-full border border-gray-800 text-[11px] font-bold cursor-pointer hover:border-yellow-500/30 transition-colors" onClick={() => setAppMode('upgrade')}>
            <Coins className="w-3.5 h-3.5 mr-2 text-yellow-500" />
            <span className="text-gray-400 mr-1.5">Tokens:</span>
            <span className="text-white">{tokens}</span>
          </div>
        )}

        {!marinaProfile.isPremium && !isTrialActive && (
          <button
            onClick={() => setAppMode('upgrade')}
            className="hidden sm:flex px-4 py-2 rounded-full text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg shadow-pink-900/30 items-center space-x-2 border border-pink-400/20"
          >
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-xs font-black uppercase tracking-tight">Pro</span>
          </button>
        )}

        <button
          onClick={() => setAppMode(appMode === 'chat' ? 'image' : 'chat')}
          className={`p-2.5 rounded-xl transition-all border ${
            appMode === 'chat' 
              ? 'bg-gray-800 border-gray-700 text-indigo-400 hover:bg-gray-700' 
              : 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/20'
          }`}
        >
          {appMode === 'chat' ? <Camera className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default Header;
