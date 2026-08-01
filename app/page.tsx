'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, TaxConfig, calculateCompleteTaxReport } from '../utils/taxCalculations';
import Link from 'next/link';

export default function Home() {
  // 1. Initialize State
  const [isLoaded, setIsLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  
  const [state, setState] = useState<AppState>({
    primary: { 
      grossSalary: 50000, 
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

  // 2. Fetch Database Config & Hydrate LocalStorage
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/tax-config');
        if (response.ok) {
          const data = await response.json();
          setTaxConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch tax configuration", error);
      }
    };
    
    const savedData = localStorage.getItem('rkr_tax_state_v3');
    if (savedData) {
      try { setState(JSON.parse(savedData)); } catch (e) {}
    }
    
    fetchConfig().then(() => setIsLoaded(true));
  }, []);

  // 3. Save to LocalStorage on Change
  useEffect(() => {
    if (isLoaded) localStorage.setItem('rkr_tax_state_v3', JSON.stringify(state));
  }, [state, isLoaded]);

  // 4. Run the Math Engine using Live Data
  const report = useMemo(() => {
    if (!taxConfig) return null;
    return calculateCompleteTaxReport(state, taxConfig);
  }, [state, taxConfig]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);

  // 5. Block Render Until DB Connects
  if (!isLoaded || !report || !taxConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
        Connecting to dynamic tax database...
      </div>
    );
  }

  // 6. User Interface
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">RKR</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RKR Tax Optimiser</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/waterfall" className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-xl transition cursor-pointer">
            Launch ISA Waterfall →
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* INPUT PANEL */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Income Details</h2>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Annual Gross Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <input 
                  type="number" 
                  value={state.primary.grossSalary || ''} 
                  onChange={(e) => setState(p => ({ ...p, primary: { ...p.primary, grossSalary: Number(e.target.value) } }))} 
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-hidden transition" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Annual Pension Contribution</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <input 
                  type="number" 
                  value={state.primary.personalPensionContribution || ''} 
                  onChange={(e) => setState(p => ({ ...p, primary: { ...p.primary, personalPensionContribution: Number(e.target.value) } }))} 
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-hidden transition" 
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-100">
              <input 
                type="checkbox" 
                checked={state.primary.isScottishResident} 
                onChange={(e) => setState(p => ({ ...p, primary: { ...p.primary, isScottishResident: e.target.checked } }))} 
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
              />
              <span className="text-sm font-semibold text-slate-700">Apply Scottish Tax Rates</span>
            </label>
          </div>

          {/* RESULTS PANEL */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-3 mb-6">Tax Breakdown (2026/27)</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Tax Code</span>
                  <span className="font-mono font-bold bg-slate-800 px-2 py-1 rounded text-slate-200">{report.primary.taxCode}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-400 font-medium">Total Tax Paid</span>
                  <span className="font-mono font-semibold text-rose-400">{formatCurrency(report.primary.totalTax)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">National Insurance</span>
                  <span className="font-mono font-semibold text-rose-400">{formatCurrency(report.primary.totalNI)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Monthly Take-Home</span>
              <span className="text-4xl font-black font-mono tracking-tight text-emerald-400">
                {formatCurrency(report.primary.normalMonthTakeHome)}
              </span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}