
import React from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import UpgradeScreen from './components/UpgradeScreen';
import SettingsPanel from './components/SettingsPanel';
import { AppProvider, useAppContext } from './context/AppContext';

const MainContent = () => {
  const { appMode } = useAppContext();

  if (appMode === 'upgrade') {
    return <UpgradeScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-85px)] max-w-7xl mx-auto p-4 md:p-8 gap-8">
      {/* Sidebar - Mature look */}
      <div className="hidden md:block w-80 bg-slate-950/60 backdrop-blur-xl rounded-[2rem] border border-burgundy-900/20 shadow-2xl overflow-hidden p-2">
        <div className="h-full bg-burgundy-950/10 rounded-[1.8rem] overflow-hidden">
            <SettingsPanel />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] border border-burgundy-900/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col relative">
        {/* Subtle top light flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-burgundy-900/10 blur-[60px] pointer-events-none" />
        
        {appMode === 'chat' ? <ChatInterface /> : <ImageGenerator />}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#020617] text-stone-200 overflow-hidden relative">
        {/* Ambient Lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-burgundy-950/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-950/10 blur-[150px] rounded-full pointer-events-none" />
        
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
};

export default App;
