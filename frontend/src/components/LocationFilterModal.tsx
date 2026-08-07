import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LocationFilterMode } from '../types';
import { MapPin, Globe, Check, X } from 'lucide-react';

interface LocationFilterModalProps {
  currentMode: LocationFilterMode;
  onSelectMode: (mode: LocationFilterMode) => void;
  onClose: () => void;
}

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  currentMode,
  onSelectMode,
  onClose,
}) => {
  const { t } = useTranslation();

  const options: { mode: LocationFilterMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'same_city',
      label: t('filterSameCity'),
      icon: <MapPin className="w-5 h-5 text-rose-400" />,
    },
    {
      mode: 'same_country',
      label: t('filterSameCountry'),
      icon: <Globe className="w-5 h-5 text-purple-400" />,
    },
    {
      mode: 'global',
      label: t('filterGlobal'),
      icon: <Globe className="w-5 h-5 text-blue-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-400" />
            <span>{t('filterTitle')}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                onSelectMode(opt.mode);
                onClose();
              }}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                currentMode === opt.mode
                  ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 border-pink-500/50 text-white font-semibold'
                  : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon}
                <span className="text-sm">{opt.label}</span>
              </div>
              {currentMode === opt.mode && <Check className="w-4 h-4 text-pink-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
