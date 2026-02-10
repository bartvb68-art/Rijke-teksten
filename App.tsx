
import React, { useState } from 'react';
import { Groep, Lengte, AppState, GeneratedContent } from './types';
import { generateDidacticContent, generateAudio } from './services/geminiService';
import InputForm from './components/InputForm';
import OutputDisplay from './components/OutputDisplay';

const groupOrder = [
  Groep.GROEP_4,
  Groep.GROEP_5,
  Groep.GROEP_6,
  Groep.GROEP_7,
  Groep.GROEP_8
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    groep: '',
    thema: '',
    lengte: '',
    isGenerating: false,
    content: null,
    audioBlob: null,
    error: null,
  });

  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setState(prev => ({ ...prev, [field]: value, error: null }));
  };

  const performGeneration = async (groep: Groep, thema: string, lengte: Lengte) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null, content: null }));
    setAudioBase64(null);

    try {
      const content = await generateDidacticContent(groep, thema, lengte);
      setState(prev => ({ ...prev, content, groep })); // Update groep to the current working level

      try {
        const audio = await generateAudio(content.hoofdtekst);
        setAudioBase64(audio);
      } catch (err) {
        console.warn("Audio generation failed:", err);
      }
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        error: `Er is iets misgegaan: ${err.message || 'Onbekende fout'}` 
      }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleGenerate = () => {
    if (!state.groep || !state.thema || !state.lengte) return;
    performGeneration(state.groep as Groep, state.thema, state.lengte as Lengte);
  };

  const handleAdjustLevel = (direction: 'easier' | 'harder') => {
    if (!state.groep || !state.content) return;
    
    const currentIndex = groupOrder.indexOf(state.groep as Groep);
    let nextIndex = currentIndex;

    if (direction === 'easier' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === 'harder' && currentIndex < groupOrder.length - 1) {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== currentIndex) {
      const nextGroup = groupOrder[nextIndex];
      performGeneration(nextGroup, state.thema, state.lengte as Lengte);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-indigo-600 text-white py-12 px-4 shadow-md mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            MeesterTekst 🍎
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            De didactische tekstgenerator voor leerkrachten. Genereer rijke teksten, audio en opdrachten in een handomdraai.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        <InputForm
          groep={state.groep}
          thema={state.thema}
          lengte={state.lengte}
          onChange={handleInputChange}
          onSubmit={handleGenerate}
          disabled={state.isGenerating}
        />

        {state.isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600">AI</span>
              </div>
            </div>
            <div className="text-center animate-pulse">
              <h3 className="text-xl font-bold text-slate-700">Rijke tekst schrijven...</h3>
              <p className="text-slate-500">We stemmen de woordenschat af op {state.groep}</p>
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-center gap-4">
            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <p className="font-bold">Oeps!</p>
              <p className="text-sm">{state.error}</p>
            </div>
          </div>
        )}

        {state.content && !state.isGenerating && (
          <OutputDisplay 
            content={state.content} 
            audioBase64={audioBase64} 
            currentGroup={state.groep as Groep}
            onAdjustLevel={handleAdjustLevel}
          />
        )}

        {!state.content && !state.isGenerating && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 opacity-60">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p className="text-slate-400 font-medium">Vul de gegevens hierboven in om je lesmateriaal te genereren.</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">© 2024 MeesterTekst - Voor en door leerkrachten.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
