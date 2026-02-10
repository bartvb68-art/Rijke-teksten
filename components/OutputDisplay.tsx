
import React, { useState } from 'react';
import { GeneratedContent, Groep } from '../types';
import AudioPlayer from './AudioPlayer';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface OutputDisplayProps {
  content: GeneratedContent;
  audioBase64: string | null;
  currentGroup: Groep;
  onAdjustLevel: (direction: 'easier' | 'harder') => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, audioBase64, currentGroup, onAdjustLevel }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const downloadTextAsDocx = async () => {
    const children: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: content.titel, bold: true, size: 36 })],
        spacing: { after: 400 },
      }),
    ];

    content.hoofdtekst.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 28 })],
          spacing: { before: 400, after: 200 },
        }));
      } else if (trimmed !== '') {
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 24 })],
          spacing: { after: 200 },
        }));
      }
    });

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.titel}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadQuestionsAsDocx = async () => {
    const children: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: `Vragen bij: ${content.titel}`, bold: true, size: 32 })],
        spacing: { after: 400 },
      }),
    ];

    content.vragen.forEach((v, i) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. [${v.type}] `, bold: true }),
          new TextRun(v.vraag)
        ],
        spacing: { after: 200 },
      }));
    });

    children.push(new Paragraph({
      children: [new TextRun({ text: "CITO-stijl Vragen", bold: true, size: 28 })],
      spacing: { before: 400, after: 200 },
    }));

    content.citoVragen.forEach((v, i) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${v.vraag}`, bold: true })],
        spacing: { after: 100 },
      }));
      Object.entries(v.opties).forEach(([label, text]) => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${label}) ${text}` })],
          indent: { left: 720 },
        }));
      });
      children.push(new Paragraph({
        children: [new TextRun({ text: `Correct antwoord: ${v.antwoord}`, italic: true, bold: true })],
        spacing: { before: 100, after: 300 },
      }));
    });

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vragen-${content.titel}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `
${content.titel} (${currentGroup})

${content.introductie.tekst}

Lees de volledige tekst en bekijk de video's via MeesterTekst.
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.titel,
          text: shareText,
          url: window.location.href,
        });
        setShareStatus('success');
      } catch (err) {
        console.error("Error sharing:", err);
        setShareStatus('error');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${window.location.href}`);
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 3000);
      } catch (err) {
        setShareStatus('error');
      }
    }
  };

  const renderHoofdtekst = () => {
    return content.hoofdtekst.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <React.Fragment key={i}>
            <div className="h-8" />
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 dyslexia-friendly">
              {trimmed.replace('## ', '')}
            </h2>
          </React.Fragment>
        );
      }
      if (trimmed === '') return null;
      return (
        <p key={i} className="mb-6 text-xl leading-loose text-left dyslexia-friendly text-slate-800">
          {trimmed}
        </p>
      );
    });
  };

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Niveau Aanpassen & Deel-knop */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
            i
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Huidig Niveau</p>
            <p className="text-indigo-900 font-bold">{currentGroup}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          <button
            onClick={() => onAdjustLevel('easier')}
            disabled={currentGroup === Groep.GROEP_4}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              currentGroup === Groep.GROEP_4 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            Vereenvoudig
          </button>
          
          <button
            onClick={() => onAdjustLevel('harder')}
            disabled={currentGroup === Groep.GROEP_8}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              currentGroup === Groep.GROEP_8 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
            Verhoog niveau
          </button>

          <button
            onClick={handleShare}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
              shareStatus === 'success' 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {shareStatus === 'success' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Gekopieerd!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Delen
              </>
            )}
          </button>
        </div>
      </div>

      {/* A. Introductie & Video's */}
      <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-indigo-700 dyslexia-friendly">Introductie</h2>
          <div className="flex gap-2">
            <button 
              onClick={downloadTextAsDocx}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              DOCX Tekst
            </button>
          </div>
        </div>
        
        <p className="text-xl text-slate-800 mb-8 leading-loose italic border-l-8 border-indigo-400 pl-6 dyslexia-friendly">
          "{content.introductie.tekst}"
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.introductie.beeldmateriaal.map((media, idx) => {
            const hasValidLink = isValidUrl(media.url);
            return (
              <a 
                key={idx} 
                href={hasValidLink ? media.url : `https://schooltv.nl/zoeken?q=${encodeURIComponent(content.titel)}`} 
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-5 rounded-2xl border transition-all group ${
                  hasValidLink 
                  ? "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50" 
                  : "bg-slate-50 border-slate-200 opacity-80"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg transition-colors ${hasValidLink ? "bg-indigo-100 group-hover:bg-indigo-200" : "bg-slate-200"}`}>
                    <svg className={`w-6 h-6 ${hasValidLink ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span className={`font-bold text-lg dyslexia-friendly ${hasValidLink ? "text-slate-900 group-hover:text-indigo-700" : "text-slate-600"}`}>
                    {media.titel}
                  </span>
                </div>
                <p className="text-sm dyslexia-friendly text-slate-600">
                  {media.beschrijving}
                </p>
                <span className="text-xs text-indigo-500 mt-3 block font-bold underline uppercase tracking-wider">
                  {hasValidLink ? "Bekijk video op SchoolTV &rarr;" : "Zoek video op SchoolTV &rarr;"}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* B. De Tekst */}
      <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900 dyslexia-friendly">{content.titel}</h1>
        <div className="h-8" />
        
        {audioBase64 && <AudioPlayer base64Data={audioBase64} />}

        <div className="max-w-none">
          {renderHoofdtekst()}
        </div>
      </section>

      {/* D. Vragen */}
      <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-10 border-b pb-6">
          <h2 className="text-2xl font-bold text-indigo-700 dyslexia-friendly">Vragen bij de tekst</h2>
          <button 
            onClick={downloadQuestionsAsDocx}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            DOCX Vragen
          </button>
        </div>

        <div className="space-y-8">
          {content.vragen.map((v, i) => (
            <div key={i} className="flex gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {i + 1}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 block mb-2 dyslexia-friendly">
                  {v.type}
                </span>
                <p className="text-slate-800 font-medium text-lg leading-relaxed dyslexia-friendly">{v.vraag}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-indigo-800 mb-8 flex items-center gap-3 dyslexia-friendly">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            </div>
            CITO-stijl Vragen
          </h3>
          <div className="space-y-10">
            {content.citoVragen.map((v, i) => (
              <div key={i} className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm">
                <p className="text-slate-900 font-bold text-xl mb-6 dyslexia-friendly">{i + 1}. {v.vraag}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(v.opties).map(([label, text]) => (
                    <div key={label} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all">
                      <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-xl font-bold text-lg">{label}</span>
                      <span className="text-slate-700 text-lg dyslexia-friendly">{text}</span>
                    </div>
                  ))}
                </div>
                <details className="mt-6 text-base group">
                  <summary className="cursor-pointer text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center gap-2 dyslexia-friendly">
                    <svg className="w-5 h-5 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    Bekijk antwoord
                  </summary>
                  <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-2xl border border-green-200 font-bold text-lg dyslexia-friendly shadow-inner">
                    Correct antwoord: {v.antwoord}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E. Differentiatie */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-amber-800 font-bold">
            <div className="bg-amber-100 p-2 rounded-xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 className="text-xl dyslexia-friendly">Extra Uitdaging</h3>
          </div>
          <p className="text-amber-900 text-lg leading-loose dyslexia-friendly">{content.differentiatie.uitdaging}</p>
        </div>
        <div className="bg-sky-50 p-8 rounded-3xl border border-sky-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-sky-800 font-bold">
            <div className="bg-sky-100 p-2 rounded-xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="text-xl dyslexia-friendly">Extra Ondersteuning</h3>
          </div>
          <p className="text-sky-900 text-lg leading-loose dyslexia-friendly">{content.differentiatie.ondersteuning}</p>
        </div>
      </section>

      {/* F. Bronvermelding */}
      <footer className="text-center pb-16 pt-8">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 dyslexia-friendly">Gebruikte Bronnen</h4>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 italic">
          {content.bronvermelding.map((bron, i) => (
            <span key={i} className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 dyslexia-friendly">{bron}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default OutputDisplay;
