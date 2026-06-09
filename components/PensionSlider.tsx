// components/PensionSlider.tsx
import React from 'react';

interface PensionSliderProps {
  grossSalary: number;
  value: number;
  onChange: (newValue: number) => void;
}

export default function PensionSlider({ grossSalary, value, onChange }: PensionSliderProps) {
  const maxSliderValue = Math.min(grossSalary, 60000);
  const percentage = grossSalary > 0 ? ((value / grossSalary) * 100).toFixed(1) : '0.0';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Personal Pension Contribution
          </label>
          <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
            {percentage}% of Salary
          </span>
        </div>
        
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
          <input 
            type="number" 
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-28 pl-7 pr-3 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden transition"
          />
        </div>
      </div>

      <input 
        type="range" 
        min="0" 
        max={maxSliderValue} 
        step="100" 
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
      />
      
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-2">
        <span>£0</span>
        <span>Max Allowance: {formatCurrency(60000)}</span>
      </div>
    </div>
  );
}