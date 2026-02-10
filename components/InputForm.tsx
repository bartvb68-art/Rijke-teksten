
import React from 'react';
import { Groep, Lengte } from '../types';

interface InputFormProps {
  groep: Groep | '';
  thema: string;
  lengte: Lengte | '';
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ groep, thema, lengte, onChange, onSubmit, disabled }) => {
  const isFormValid = groep !== '' && thema.trim() !== '' && lengte !== '';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 dyslexia-friendly">
      <h2 className="text-xl font-bold mb-6 text-indigo-700">Stel je lesmateriaal samen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. Kies de groep
          </label>
          <select
            value={groep}
            onChange={(e) => onChange('groep', e.target.value)}
            disabled={disabled}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">Selecteer groep...</option>
            {Object.values(Groep).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            2. Het thema
          </label>
          <input
            type="text"
            value={thema}
            onChange={(e) => onChange('thema', e.target.value)}
            disabled={disabled}
            placeholder="Bijv: Ruimtevaart, De Tweede Wereldoorlog..."
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            3. Gewenste lengte
          </label>
          <select
            value={lengte}
            onChange={(e) => onChange('lengte', e.target.value)}
            disabled={disabled}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">Selecteer lengte...</option>
            {Object.values(Lengte).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={disabled || !isFormValid}
        className={`mt-8 w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] ${
          disabled || !isFormValid
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'
        }`}
      >
        {disabled ? 'Bezig met genereren...' : 'Genereer tekst'}
      </button>
      
      {!isFormValid && !disabled && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          Vul alle velden in om te beginnen.
        </p>
      )}
    </div>
  );
};

export default InputForm;
