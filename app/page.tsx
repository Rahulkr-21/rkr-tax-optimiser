// src/app/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PensionSlider from '../components/PensionSlider';
import { AppState, calculateCompleteTaxReport } from '../utils/taxCalculations';
import Link from 'next/link';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [state, setState] = useState<AppState>({
    primary: { grossSalary: 42000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 3300, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-04-06', monthlyExpenses: 1500 }
  });

  useEffect(() => {
    const savedData = localStorage.getItem('rkr_tax_state_v3');
    if (savedData) {
      try { setState(JSON.parse(savedData)); } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('rkr_tax_state_v3', JSON.stringify(state));
  }, [state, isLoaded]);

  const report = useMemo(() => calculateCompleteTaxReport(state), [state]);
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);

  if (!isLoaded) return null; 

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm tracking-wider">RKR</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RKR Tax Optimiser</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/waterfall" className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-xl border border-indigo-100 transition cursor-pointer">
            Launch ISA Waterfall →
          </Link>
          <span className="text-xs bg-slate-100 font-semibold px-3 py-2 rounded-full text-slate-600 border border-slate-200">UK Tax Year 2026/27</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <section className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600"></span> Primary Earner Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Annual Contracted Salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                  <input type="number" value={state.primary.grossSalary || ''} onChange={(e) => { const newSalary = Number(e.target.value); setState(p => ({ primary: { ...p.primary, grossSalary: newSalary, personalPensionContribution: Math.min(p.primary.personalPensionContribution, newSalary) } })); }} className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Job Start Date</label>
                <input type="date" min="2026-04-06" max="2027-04-05" value={state.primary.startDate} onChange={(e) => setState(p => ({ primary: { ...p.primary, startDate: e.target.value } }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden transition text-slate-700" />
              </div>

              <div className="border-t border-slate-100 pt-6 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Expected Bonus Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                    <input type="number" value={state.primary.bonus || ''} onChange={(e) => setState(p => ({ primary: { ...p.primary, bonus: Number(e.target.value) } }))} className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Bonus Payout Date</label>
                  <input type="date" min="2026-04-06" max="2027-04-05" value={state.primary.bonusDate} onChange={(e) => setState(p => ({ primary: { ...p.primary, bonusDate: e.target.value } }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden transition text-slate-700" />
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6 md:col-span-2">
                <PensionSlider grossSalary={state.primary.grossSalary} value={state.primary.personalPensionContribution} onChange={(newValue) => setState(p => ({ primary: { ...p.primary, personalPensionContribution: newValue } }))} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> Pro Optimisation Steps</h2>
            <div className="space-y-4">
              {report.optimisationTips.map((tip, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: tip.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-400 font-bold tracking-wide">$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-[420px]">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl sticky top-8 border border-slate-800 space-y-6">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Normal Monthly Take-Home</p>
              <h3 className="text-4xl font-extrabold text-emerald-400 tracking-tight">{formatCurrency(report.primary.normalMonthTakeHome)}</h3>
              {report.primary.firstMonthTakeHome > report.primary.normalMonthTakeHome + 5 && (
                <div className="mt-3 bg-emerald-950/50 border border-emerald-500/30 p-2.5 rounded-lg">
                  <p className="text-xs text-emerald-300"><strong className="text-emerald-400">First Paycheck Boost:</strong> Due to accumulated tax-free allowance from your start date, your first paycheck will be <strong className="font-mono">{formatCurrency(report.primary.firstMonthTakeHome)}</strong>.</p>
                </div>
              )}
              {state.primary.bonus > 0 && (
                <div className="mt-3 bg-blue-950/50 border border-blue-500/30 p-2.5 rounded-lg">
                  <p className="text-xs text-blue-300"><strong className="text-blue-400">Bonus Month Take-Home:</strong> In {new Date(state.primary.bonusDate).toLocaleString('default', { month: 'short' })}, your total paycheck will spike to <strong className="font-mono">{formatCurrency(report.primary.bonusMonthTakeHome)}</strong>.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex justify-between items-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Tax Code</span>
                <span className="text-[11px] text-slate-500">Working {report.primary.monthsWorked} months this year.</span>
              </div>
              <span className="bg-slate-950 text-white font-mono font-bold text-lg px-3 py-1 rounded-lg border border-slate-700">{report.primary.taxCode}</span>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Total Tax Year Projection</h4>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Actual Gross Pay (Prorated)</span><span className="font-mono">{formatCurrency(report.primary.actualGrossIncome)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Total Tax Deducted</span><span className="font-mono text-rose-400">-{formatCurrency(report.primary.totalTax)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Total NI Deducted</span><span className="font-mono text-rose-400">-{formatCurrency(report.primary.totalNI)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Total Pension Saved</span><span className="font-mono text-blue-400">+{formatCurrency(report.primary.totalPension)}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800"><span className="text-slate-200 font-bold">Total Annual Net</span><span className="font-mono text-emerald-400 font-bold">{formatCurrency(report.primary.totalTakeHome)}</span></div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}