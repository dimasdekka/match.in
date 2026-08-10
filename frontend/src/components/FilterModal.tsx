import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Sliders, Check } from 'lucide-react';
import { filterSchema, type FilterSchemaType } from '../schemas';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterSchemaType) => void;
  currentFilters?: Partial<FilterSchemaType>;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilter,
  currentFilters,
}) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FilterSchemaType>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      target_location_mode: currentFilters?.target_location_mode || 'same_city',
      target_gender: currentFilters?.target_gender || 'all',
      min_age_pref: currentFilters?.min_age_pref || 18,
      max_age_pref: currentFilters?.max_age_pref || 50,
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: FilterSchemaType) => {
    onApplyFilter(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-white">{t('filterTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Location Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Jangkauan Lokasi</label>
            <select
              {...register('target_location_mode')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="same_city">{t('filterSameCity')}</option>
              <option value="same_country">{t('filterSameCountry')}</option>
              <option value="global">{t('filterGlobal')}</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('interestedIn')}</label>
            <select
              {...register('target_gender')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="all">{t('everyone')}</option>
              <option value="female">{t('female')}</option>
              <option value="male">{t('male')}</option>
            </select>
          </div>

          {/* Age Filter Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Rentang Usia</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Min</label>
                <input
                  type="number"
                  {...register('min_age_pref', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
                {errors.min_age_pref && (
                  <p className="text-[11px] text-rose-400">{errors.min_age_pref.message}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Max</label>
                <input
                  type="number"
                  {...register('max_age_pref', { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
                {errors.max_age_pref && (
                  <p className="text-[11px] text-rose-400">{errors.max_age_pref.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow-md shadow-pink-500/20"
            >
              <Check className="w-4 h-4" /> Terapkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
