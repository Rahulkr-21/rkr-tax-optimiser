'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, TaxConfig, calculateCompleteTaxReport } from '../utils/taxCalculations';
import Link from 'next/link';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  const [pensionMode, setPensionMode] = useState<'amount' | 'percent'>('amount');
  const [pensionPercent, setPensionPercent] = useState<number | ''>('');
  
  // 1. Dark Mode State
  const [darkMode, setDarkMode] = useState(false);
  
  const [state, setState] = useState<AppState>({
    primary: { 
      grossSalary: 48000, 
      bonus: 0, 
      bonusDate: '2026-12-20', 
      employerPensionContribution: 0, 
      personalPensionContribution: 0, 
      pensionType: 'salary_sacrifice', 
      studentLoanPlan: 'none', 
      startDate: '2026-04-06', 
      monthlyExpenses: 2000, 
      isScottishResident: false 
    }
  });

  // Fetch data & load theme preference
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/tax-config');
        if (response.ok) setTaxConfig(await response.json());
      } catch (error) {
        console.error("Failed to fetch config", error);
      }
    };
    
    const savedTheme = localStorage.getItem('rkr_theme');
    if (savedTheme === 'dark') setDarkMode(true);

    const savedData = localStorage.getItem('rkr_tax_state_v4');
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        setState(parsed.state);
        setPensionMode(parsed.pensionMode || 'amount');
        setPensionPercent(parsed.pensionPercent || '');
      } catch (e) {}
    }
    
    fetchConfig().then(() => setIsLoaded(true));
  }, []);

  // Save state & theme
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('rkr_tax_state_v4', JSON.stringify({ state, pensionMode, pensionPercent }));
      localStorage.setItem('rkr_theme', darkMode ? 'dark' : 'light');
      
      if (darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [state, pensionMode, pensionPercent, isLoaded, darkMode]);

  const report = useMemo(() => {
    if (!taxConfig) return null;
    return calculateCompleteTaxReport(state, taxConfig);
  }, [state, taxConfig]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);

  const renderTipText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
      part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-slate-900 dark:text-white">{part.slice(2, -2)}</strong> : part
    );
  };

  const handleSalaryChange = (val: number) => {
    setState(p => {
      const newState = { ...p, primary: { ...p.primary, grossSalary: val } };
      if (pensionMode === 'percent' && pensionPercent !== '') {
        newState.primary.personalPensionContribution = (Number(pensionPercent) / 100) * val;
      }
      return newState;
    });
  };

  // 2. Tax Trap Calculations
  const adjustedIncome = state.primary.grossSalary - state.primary.personalPensionContribution;
  const isTaxTrap = adjustedIncome > 100000;
  const allowanceLost = isTaxTrap ? Math.min((adjustedIncome - 100000) / 2, 12570) : 0;
  const amountToSacrifice = adjustedIncome - 100000;

  if (!isLoaded || !report || !taxConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold text-sm">
        Connecting to dynamic tax database...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
      
      {/* HEADER (Hidden during PDF export) */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex justify-between items-center shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">RKR</div>
          <h1 className="text-xl font-bold tracking-tight">RKR Tax Optimiser</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => window.print()} 
            className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            📄 Export PDF
          </button>
          <Link href="/waterfall" className="text-xs bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold px-4 py-2 rounded-xl transition cursor-pointer">
            Launch ISA Waterfall →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 print:py-0 print:space-y-4">
        
        {/* PDF Export Header (Only visible when printing) */}
        <div className="hidden print:block mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900">RKR Wealth & Tax Report</h1>
          <p className="text-sm text-slate-500 mt-1">Generated dynamically for the 2026/27 Tax Year.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
          
          {/* INPUT PANEL (Hidden during PDF export) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6 print:hidden">
            <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Income Details</h2>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Annual Gross Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <input 
                  type="number" 
                  value={state.primary.grossSalary || ''} 
                  onChange={(e) => handleSalaryChange(Number(e.target.value))} 
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-hidden transition" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Annual Pension</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setPensionMode('amount')} 
                    className={`text-[10px] px-2.5 py-1 rounded-sm font-bold transition ${pensionMode === 'amount' ? 'bg-white dark:bg-slate-600 shadow-xs text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >£</button>
                  <button 
                    onClick={() => setPensionMode('percent')} 
                    className={`text-[10px] px-2.5 py-1 rounded-sm font-bold transition ${pensionMode === 'percent' ? 'bg-white dark:bg-slate-600 shadow-xs text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >%</button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {pensionMode === 'amount' ? '£' : '%'}
                </span>
                <input 
                  type="number" 
                  value={pensionMode === 'percent' ? pensionPercent : state.primary.personalPensionContribution || ''} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (pensionMode === 'percent') {
                      setPensionPercent(val);
                      setState(p => ({ ...p, primary: { ...p.primary, personalPensionContribution: (val / 100) * p.primary.grossSalary } }));
                    } else {
                      setState(p => ({ ...p, primary: { ...p.primary, personalPensionContribution: val } }));
                    }
                  }} 
                  className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-hidden transition" 
                />
              </div>
              {pensionMode === 'percent' && state.primary.personalPensionContribution > 0 && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-right font-medium">
                  Calculated: {formatCurrency(state.primary.personalPensionContribution)}/yr
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
              <input 
                type="checkbox" 
                checked={state.primary.isScottishResident} 
                onChange={(e) => setState(p => ({ ...p, primary: { ...p.primary, isScottishResident: e.target.checked } }))} 
                className="w-5 h-5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 bg-transparent" 
              />
              <span className="text-sm font-semibold">Apply Scottish Tax Rates</span>
            </label>
          </div>

          {/* RESULTS PANEL (Visible in PDF export) */}
          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-2xl shadow-xl text-white flex flex-col justify-between print:bg-white print:text-slate-900 print:shadow-none print:border print:border-slate-200 print:w-full">
            <div>
              <h2 className="text-lg font-bold text-slate-100 print:text-slate-900 border-b border-slate-700 print:border-slate-200 pb-3 mb-6">Tax Breakdown (2026/27)</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 print:text-slate-600 font-medium">Tax Code</span>
                  <span className="font-mono font-bold bg-slate-800 print:bg-slate-100 px-2 py-1 rounded text-slate-200 print:text-slate-800">{report.primary.taxCode}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm border-t border-slate-800 print:border-slate-200 pt-3">
                  <span className="text-slate-400 print:text-slate-600 font-medium">Total Tax Paid</span>
                  <span className="font-mono font-semibold text-rose-400 print:text-rose-600">{formatCurrency(report.primary.totalTax)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 print:text-slate-600 font-medium">National Insurance</span>
                  <span className="font-mono font-semibold text-rose-400 print:text-rose-600">{formatCurrency(report.primary.totalNI)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700 print:border-slate-200">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-500 mb-1">Monthly Take-Home</span>
              <span className="text-4xl font-black font-mono tracking-tight text-emerald-400 print:text-emerald-600">
                {formatCurrency(report.primary.normalMonthTakeHome)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. THE £100k TAX TRAP VISUALIZER */}
        {isTaxTrap && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-6 rounded-2xl shadow-xs mt-6 print:break-inside-avoid">
            <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-900/50 pb-3 flex items-center gap-2">
              <span>⚠️</span> The £100k Tax Trap Alert
            </h2>
            <div className="mt-4 space-y-4 text-sm text-rose-800 dark:text-rose-200/90 leading-relaxed">
              <p>
                Your adjusted income is currently <strong>{formatCurrency(adjustedIncome)}</strong>, which pushes you directly into the UK's 60%+ marginal tax trap.
              </p>
              <p>
                For every £2 you earn over £100,000, the government removes £1 of your tax-free Personal Allowance. You are currently losing <strong>{formatCurrency(allowanceLost)}</strong> of this allowance, subjecting that income to highly aggressive taxation.
              </p>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-100 dark:border-rose-900 mt-2 shadow-xs print:border-slate-200">
                <span className="block text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Optimal Strategy</span>
                If you increase your annual pension salary sacrifice by exactly <strong>{formatCurrency(amountToSacrifice)}</strong>, you will legally bring your adjusted net income back down to £100,000. This action instantly restores your full Personal Allowance and shields that surplus capital from the ~60% tax rate, securely dropping it into your retirement portfolio instead.
              </div>
            </div>
          </div>
        )}

        {/* MATH ENGINE INSIGHTS */}
        {report.optimisationTips.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-blue-100 dark:border-blue-900/30 space-y-4 mt-6 print:break-inside-avoid print:border-slate-200">
            <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <span className="text-blue-500">⚡</span> Live Tax Analysis
            </h2>
            <div className="space-y-3">
              {report.optimisationTips.map((tip, idx) => (
                <div key={idx} className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30 leading-relaxed print:bg-slate-50 print:border-slate-100 print:text-slate-800">
                  {renderTipText(tip)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALTERNATIVE STRATEGIES (Hidden during PDF export) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 mt-6 print:hidden">
          <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Maximise Your Take-Home (Without Changing Pensions)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 my-4">If you prefer to keep building your retirement pot, you can still optimise your monthly pay using these UK tax allowances:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h3 className="font-bold text-sm mb-1">1. Claim Professional Subscriptions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">If you pay for union fees or professional bodies required for your job, you can claim tax relief on them, adjusting your tax code to pay less tax each month.</p>
            </div>
            
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h3 className="font-bold text-sm mb-1">2. Marriage Allowance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">If you are married/civil partnered and one of you earns below £12,570 while the other pays basic rate tax, you can transfer £1,260 of personal allowance, reducing your tax bill by up to £252 a year.</p>
            </div>
            
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h3 className="font-bold text-sm mb-1">3. Cycle to Work Scheme</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Purchasing a bike through your employer operates via salary sacrifice. It reduces your gross taxable pay, saving you 32% to 47% in combined Income Tax and National Insurance.</p>
            </div>

            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h3 className="font-bold text-sm mb-1">4. Work from Home Relief</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">If your employer explicitly requires you to work from home, you can claim tax relief on £6 a week to cover extra household costs, slightly boosting your net pay.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}