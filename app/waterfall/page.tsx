// app/waterfall/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
// ADD TaxConfig to the import
import { AppState, TaxConfig, calculateCompleteTaxReport } from '../../utils/taxCalculations';
import Link from 'next/link';

export default function WaterfallPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  
  const [state, setState] = useState<AppState>({
    primary: { grossSalary: 42000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 3300, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-04-06', monthlyExpenses: 0, isScottishResident: false },
    partner: { grossSalary: 55000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 2750, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-10-06', monthlyExpenses: 0, isScottishResident: true },
    useHouseholdMode: false,
    useLISA: true,
    householdExpenses: 2500
  });

  useEffect(() => {
    // 1. Fetch the live database config
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
    
    // 2. Load cached local state if it exists
    const savedData = localStorage.getItem('rkr_tax_state_v4');
    if (savedData) {
      try { setState(JSON.parse(savedData)); } catch (e) {}
    }
    
    fetchConfig().then(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('rkr_tax_state_v4', JSON.stringify(state));
  }, [state, isLoaded]);

  // 3. Inject the config into the math engine
  const report = useMemo(() => {
    if (!taxConfig) return null;
    return calculateCompleteTaxReport(state, taxConfig);
  }, [state, taxConfig]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);

  // 4. Block render until database connection succeeds
  if (!isLoaded || !report || !taxConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
        Connecting to dynamic tax database...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm tracking-wider">RKR</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RKR Wealth Waterfall</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-200 transition cursor-pointer">
            ← Back to Tax Calculator
          </Link>
          <span className="text-xs bg-indigo-50 font-semibold px-3 py-2 rounded-full text-indigo-600 border border-indigo-100">UK Investment Wrappers 2026/27</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* STRATEGY CONTROLS */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Strategy Configuration</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useHouseholdMode} onChange={(e) => setState(p => ({ ...p, useHouseholdMode: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
              <span className="text-sm font-semibold text-slate-700">Enable Dual-Income Household Mode</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useLISA} onChange={(e) => setState(p => ({ ...p, useLISA: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
              <span className="text-sm font-semibold text-slate-700">Opt-in to Lifetime ISA (LISA) Allocation</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Household Living Expenses</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <input type="number" value={state.householdExpenses || ''} onChange={(e) => setState(p => ({ ...p, householdExpenses: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden transition" />
              </div>
            </div>

            {state.useHouseholdMode && state.partner && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Partner Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                    <input type="number" value={state.partner.grossSalary || ''} onChange={(e) => setState(p => ({ ...p, partner: { ...p.partner!, grossSalary: Number(e.target.value) } }))} className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Partner Start Date</label>
                  <input type="date" value={state.partner.startDate} onChange={(e) => setState(p => ({ ...p, partner: { ...p.partner!, startDate: e.target.value } }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden transition" />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Total Pooled Monthly Surplus:</span>
            <span className={`text-2xl font-black font-mono tracking-tight ${report.waterfall.disposableIncome >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {formatCurrency(report.waterfall.disposableIncome)}
            </span>
          </div>
        </div>

        {/* BOTTOM PANEL: THE WATERFALL VISUALISATION */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Allocation Roadmap {state.useHouseholdMode && '(Dual Allowances)'}
          </h2>
          <p className="text-xs text-slate-500 mb-6">Your surplus cash dynamically cascading through legal UK tax shelters.</p>

          {report.waterfall.disposableIncome > 0 ? (
            <div className="space-y-4">
              {/* Step 1: Emergency Fund */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Build Emergency Fund</h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">Before investing, maintain liquid capital in an Easy-Access Cash ISA or high-yield savings account.</p>
                  </div>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-right shrink-0 w-full md:w-36">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Safety Target</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(report.waterfall.emergencyTarget)}</span>
                </div>
              </div>

              {/* Step 2: LISA (Conditionally Rendered) */}
              {state.useLISA && (
                <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition ${report.waterfall.lisaAllocation > 0 ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${report.waterfall.lisaAllocation > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}>2</div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Lifetime ISA (LISA) Wrapper</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">The government injects an immediate 25% risk-free bonus on your deposits. {state.useHouseholdMode ? 'Pooled household max: £8,000/year.' : 'Max: £4,000/year.'}</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-right shrink-0 w-full md:w-36">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Route</span>
                    <span className="font-mono font-bold text-emerald-600">+{formatCurrency(report.waterfall.lisaAllocation)}</span>
                  </div>
                </div>
              )}

              {/* Step 3: ISA */}
              <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition ${report.waterfall.isaAllocation > 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
                <div className="flex items-start gap-4">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${report.waterfall.isaAllocation > 0 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>{state.useLISA ? '3' : '2'}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Stocks & Shares ISA</h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">Deploy remaining cash into low-cost index funds. Capital gains are 100% legally shielded from tax forever. {state.useHouseholdMode ? 'Pooled household max: £40,000/year.' : 'Max £20,000/year.'}</p>
                  </div>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-right shrink-0 w-full md:w-36">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Route</span>
                  <span className="font-mono font-bold text-emerald-600">+{formatCurrency(report.waterfall.isaAllocation)}</span>
                </div>
              </div>

              {/* Step 4: GIA */}
              {report.waterfall.giaAllocation > 0 && (
                <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-amber-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0">{state.useLISA ? '4' : '3'}</div>
                    <div>
                      <h3 className="font-bold text-amber-900 text-sm">General Investment Account (GIA)</h3>
                      <p className="text-xs text-amber-700 mt-0.5 max-w-xl leading-relaxed">Your surplus cash has saturated your entire annual ISA allowance limits. Direct the overflow here.</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 text-right shrink-0 w-full md:w-36">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Route</span>
                    <span className="font-mono font-bold text-amber-600">+{formatCurrency(report.waterfall.giaAllocation)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center text-sm text-rose-600 font-medium">
              Your living expenses currently exhaust your calculated monthly take-home. 
            </div>
          )}
        </div>
      </main>
    </div>
  );
}