'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, TaxConfig, calculateCompleteTaxReport } from '../../utils/taxCalculations';
import Link from 'next/link';

export default function WaterfallPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  
  // Custom interactive states
  const [darkMode, setDarkMode] = useState(false);
  const [emergencyFundFilled, setEmergencyFundFilled] = useState(false);
  const [isaPreference, setIsaPreference] = useState<'fixed' | 'diy' | 'robo' | 'vanguard'>('diy');
  const [emergencyPreference, setEmergencyPreference] = useState<'joint' | 'yield' | 'cashIsa' | 'bonds'>('yield');
  const [giaPreference, setGiaPreference] = useState<'ii' | 'investEngine' | 't212' | 'ibkr'>('t212');
  
  const [state, setState] = useState<AppState>({
    primary: { grossSalary: 48000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 0, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-04-06', monthlyExpenses: 0, isScottishResident: false },
    partner: { grossSalary: 55000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 2750, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-10-06', monthlyExpenses: 0, isScottishResident: true },
    useHouseholdMode: false,
    useLISA: true,
    householdExpenses: 2500
  });

  // Dynamically update dropdown options when toggling household mode
  useEffect(() => {
    if (state.useHouseholdMode) {
      setIsaPreference('fixed');
      setEmergencyPreference('joint');
      setGiaPreference('ii');
    } else {
      setIsaPreference('diy');
      setEmergencyPreference('yield');
      setGiaPreference('t212');
    }
  }, [state.useHouseholdMode]);

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
    
    // Load Dark Mode Preference
    const savedTheme = localStorage.getItem('rkr_theme');
    if (savedTheme === 'dark') setDarkMode(true);

    const savedData = localStorage.getItem('rkr_tax_state_v4');
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        const incomingState = parsed.state || parsed;

        setState(current => ({
          ...current,
          ...incomingState,
          partner: incomingState.partner || current.partner,
          useHouseholdMode: incomingState.useHouseholdMode !== undefined ? incomingState.useHouseholdMode : current.useHouseholdMode,
          useLISA: incomingState.useLISA !== undefined ? incomingState.useLISA : current.useLISA,
          householdExpenses: incomingState.householdExpenses !== undefined ? incomingState.householdExpenses : current.householdExpenses
        }));
        
        if (parsed.emergencyFundFilled !== undefined) setEmergencyFundFilled(parsed.emergencyFundFilled);
        if (parsed.giaPreference) setGiaPreference(parsed.giaPreference);
      } catch (e) {}
    }
    
    fetchConfig().then(() => setIsLoaded(true));
  }, []);

  // Save State and Apply Dark Mode Class
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('rkr_theme', darkMode ? 'dark' : 'light');
      if (darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');

      const savedData = localStorage.getItem('rkr_tax_state_v4');
      let payload = { state, emergencyFundFilled, giaPreference };
      if (savedData) {
         try {
             const parsed = JSON.parse(savedData);
             payload = { ...parsed, state, emergencyFundFilled, giaPreference };
         } catch(e) {}
      }
      localStorage.setItem('rkr_tax_state_v4', JSON.stringify(payload));
    }
  }, [state, emergencyFundFilled, giaPreference, isLoaded, darkMode]);

  const report = useMemo(() => {
    if (!taxConfig || !state.primary) return null;
    try {
        return calculateCompleteTaxReport(state, taxConfig);
    } catch (e) {
        return null;
    }
  }, [state, taxConfig]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);

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
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm tracking-wider">RKR</div>
          <h1 className="text-xl font-bold tracking-tight">RKR Wealth Waterfall</h1>
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
          <Link href="/" className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer">
            ← Back to Tax Calculator
          </Link>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 font-semibold px-3 py-2 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 hidden md:inline-block">UK Investment Wrappers 2026/27</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 print:py-0">
        
        {/* PDF Export Header (Only visible when printing) */}
        <div className="hidden print:block mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900">RKR Wealth Allocation Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1">Generated dynamically for the 2026/27 Tax Year.</p>
        </div>

        {/* STRATEGY CONTROLS (Hidden during print for a cleaner report) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 print:hidden">
          <h2 className="text-lg font-bold mb-4">Strategy Configuration</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useHouseholdMode || false} onChange={(e) => setState(p => ({ ...p, useHouseholdMode: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded bg-transparent border-slate-300 dark:border-slate-600" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Dual-Income Household Mode</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useLISA !== false} onChange={(e) => setState(p => ({ ...p, useLISA: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded bg-transparent border-slate-300 dark:border-slate-600" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Opt-in to Lifetime ISA (LISA) Allocation</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Household Living Expenses</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                <input type="number" value={state.householdExpenses || ''} onChange={(e) => setState(p => ({ ...p, householdExpenses: Number(e.target.value) }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-transparent transition" />
              </div>
            </div>

            {state.useHouseholdMode && state.partner && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Partner Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                    <input type="number" value={state.partner.grossSalary || ''} onChange={(e) => setState(p => ({ ...p, partner: { ...p.partner!, grossSalary: Number(e.target.value) } }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-transparent transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Partner Start Date</label>
                  <input type="date" value={state.partner.startDate} onChange={(e) => setState(p => ({ ...p, partner: { ...p.partner!, startDate: e.target.value } }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-transparent transition" />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Pooled Monthly Surplus:</span>
            <span className={`text-2xl font-black font-mono tracking-tight ${report.waterfall.disposableIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {formatCurrency(report.waterfall.disposableIncome)}
            </span>
          </div>
        </div>

        {/* BOTTOM PANEL: THE WATERFALL VISUALISATION */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 print:shadow-none print:border-none print:p-0">
          
          {/* Print Only Summary */}
          <div className="hidden print:flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <span className="text-sm font-semibold text-slate-500">Monthly Target Surplus to Allocate:</span>
            <span className="text-xl font-black font-mono tracking-tight text-emerald-600">{formatCurrency(report.waterfall.disposableIncome)}</span>
          </div>

          <h2 className="text-lg font-bold mb-2 flex items-center gap-2 print:text-slate-900">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Allocation Roadmap {state.useHouseholdMode && '(Dual Allowances)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 print:text-slate-600">Your surplus cash dynamically cascading through legal UK tax shelters.</p>

          {report.waterfall.disposableIncome > 0 ? (
            <div className="space-y-4">
              
              {/* Step 1: Emergency Fund (INTERACTIVE) */}
              <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative transition duration-300 print:border-slate-200 print:bg-white print:break-inside-avoid ${emergencyFundFilled ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1 transition print:bg-slate-900 print:text-white ${emergencyFundFilled ? 'bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'}`}>1</div>
                    
                    <div className="flex-1 pr-0 md:pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-sm print:text-slate-900 ${emergencyFundFilled ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>Build Emergency Fund</h3>
                        <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition print:hidden">
                          <input 
                            type="checkbox" 
                            checked={emergencyFundFilled} 
                            onChange={(e) => setEmergencyFundFilled(e.target.checked)} 
                            className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer bg-transparent" 
                          />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Completed</span>
                        </label>
                      </div>

                      {emergencyFundFilled ? (
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed font-medium print:text-slate-600">
                          Excellent work. Your safety net is fully funded. 100% of your monthly surplus is now aggressively cascading past this step directly into your investment wrappers.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed mb-5 print:text-slate-600">Before investing, maintain highly liquid capital to securely cover immediate lifestyle overheads or upcoming transition costs.</p>

                          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-none print:p-0 print:shadow-none">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block print:hidden">2026 Liquid Storage Options</label>
                            
                            <select value={emergencyPreference} onChange={(e) => setEmergencyPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-500 outline-hidden mb-3 bg-slate-50 dark:bg-slate-800 cursor-pointer print:hidden">
                              {state.useHouseholdMode ? (
                                <>
                                  <option value="joint">Monzo / Starling (Best for Household Pooling)</option>
                                  <option value="bonds">NS&I Premium Bonds (Best for Tax-Free Safety)</option>
                                </>
                              ) : (
                                <>
                                  <option value="yield">Chase UK / Chip (Best for High-Yield Easy Access)</option>
                                  <option value="cashIsa">Trading 212 Cash ISA (Best for Shielding Interest)</option>
                                </>
                              )}
                            </select>

                            {state.useHouseholdMode && emergencyPreference === 'joint' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Monzo / Starling:</strong> The optimal choice for transparently tracking dual-income ledgers and managing shared apartment overheads. You can securely ring-fence transition capital for your relocation in dedicated "Spaces" while keeping it instantly accessible.</p>
                            )}
                            {state.useHouseholdMode && emergencyPreference === 'bonds' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Premium Bonds:</strong> Backed by HM Treasury. Instead of earning standard interest (which couples with high combined savings could be taxed on), you are entered into a monthly tax-free prize draw. Highly secure for large pooled emergency funds.</p>
                            )}
                            {!state.useHouseholdMode && emergencyPreference === 'yield' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Chase UK / Chip:</strong> Consistently hovering around the top of the easy-access interest rate tables. Perfect for generating a solid yield on the capital you need to keep liquid for your upcoming structural relocation.</p>
                            )}
                            {!state.useHouseholdMode && emergencyPreference === 'cashIsa' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Trading 212 Cash ISA:</strong> If your cash savings generate more than £500-£1000 in interest this year, standard accounts will trigger tax. This fully protects your safety net from taxation while offering instant withdrawals.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border text-right shrink-0 w-full md:w-36 transition print:border-slate-200 ${emergencyFundFilled ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700'}`}>
                  <span className={`block text-[9px] font-bold uppercase tracking-wider print:text-slate-500 ${emergencyFundFilled ? 'text-emerald-500' : 'text-slate-400'}`}>Safety Target</span>
                  <span className={`font-mono font-bold print:text-slate-900 ${emergencyFundFilled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {emergencyFundFilled ? 'ACHIEVED' : formatCurrency(report.waterfall.emergencyTarget)}
                  </span>
                </div>
              </div>

              {/* Step 2: LISA */}
              {state.useLISA && (
                <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative transition print:break-inside-avoid print:bg-white print:border-slate-200 ${report.waterfall.lisaAllocation > 0 ? 'bg-indigo-50/40 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50 opacity-50 print:opacity-100'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 print:bg-indigo-600 print:text-white ${report.waterfall.lisaAllocation > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>2</div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm print:text-slate-900">Lifetime ISA (LISA) Wrapper</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed print:text-slate-600">The government injects an immediate 25% risk-free bonus on your deposits. {state.useHouseholdMode ? 'Pooled household max: £8,000/year.' : 'Max: £4,000/year.'}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right shrink-0 w-full md:w-36 print:border-slate-200">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Monthly Route</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-600">+{formatCurrency(report.waterfall.lisaAllocation)}</span>
                  </div>
                </div>
              )}

              {/* Step 3: ISA */}
              <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative transition print:break-inside-avoid print:bg-white print:border-slate-200 ${report.waterfall.isaAllocation > 0 ? 'bg-blue-50/40 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50 opacity-50 print:opacity-100'}`}>
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1 print:bg-blue-600 print:text-white ${report.waterfall.isaAllocation > 0 ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{state.useLISA ? '3' : '2'}</div>
                    <div className="flex-1 pr-0 md:pr-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm print:text-slate-900">Stocks & Shares ISA</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed mb-5 print:text-slate-600">Deploy remaining cash into markets. Capital gains are 100% shielded from tax forever. {state.useHouseholdMode ? 'Pooled household max: £40,000/year.' : 'Max £20,000/year.'}</p>
                      
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100/70 dark:border-blue-900/50 shadow-xs print:border-none print:p-0 print:shadow-none">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block print:hidden">2026 Platform Selector</label>
                        
                        <select value={isaPreference} onChange={(e) => setIsaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden mb-3 bg-slate-50 dark:bg-slate-800 cursor-pointer print:hidden">
                          {state.useHouseholdMode ? (
                            <>
                              <option value="fixed">Interactive Investor (Best for Joint Accounts & High Net Worth)</option>
                              <option value="robo">Wealthify (Best for Hands-off Managed Portfolios)</option>
                            </>
                          ) : (
                            <>
                              <option value="diy">Trading 212 (Best for Zero-Fee Custom Portfolios)</option>
                              <option value="vanguard">Vanguard UK (Best for Passive Low-Cost Indexing)</option>
                            </>
                          )}
                        </select>

                        {state.useHouseholdMode && isaPreference === 'fixed' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Interactive Investor (ii):</strong> When combining finances, a flat-fee broker is mathematically optimal. The monthly cost stays static regardless of how large the pooled portfolio grows, providing a rigorous structure for maximizing dual tax efficiency.</p>
                        )}
                        {state.useHouseholdMode && isaPreference === 'robo' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Wealthify:</strong> Highly effective if demanding professional schedules require a hands-off approach to joint wealth building. Their algorithms handle all asset allocation based on a shared risk profile.</p>
                        )}
                        {!state.useHouseholdMode && isaPreference === 'diy' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Trading 212:</strong> A top choice for absolute control. Perfect if you want to deploy capital strategically and heavily weight your portfolio towards cybersecurity ETFs and tech stocks without paying any commission fees.</p>
                        )}
                        {!state.useHouseholdMode && isaPreference === 'vanguard' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Vanguard UK:</strong> The industry standard for a "fire and forget" strategy. Exceptionally low platform fees designed purely for consistently buying into global index funds.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right shrink-0 w-full md:w-36 print:border-slate-200">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Monthly Route</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-600">+{formatCurrency(report.waterfall.isaAllocation)}</span>
                </div>
              </div>

              {/* Step 4: GIA */}
              {report.waterfall.giaAllocation > 0 && (
                <div className="bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative print:break-inside-avoid print:bg-white print:border-slate-200">
                  <div className="flex-1 w-full">
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 bg-amber-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1">{state.useLISA ? '4' : '3'}</div>
                      <div className="flex-1 pr-0 md:pr-4">
                        <h3 className="font-bold text-amber-900 dark:text-amber-500 text-sm print:text-slate-900">General Investment Account (GIA)</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-200/70 mt-0.5 max-w-xl leading-relaxed mb-5 print:text-slate-600">Your surplus cash has saturated your entire annual ISA allowance limits. Direct the overflow here.</p>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/50 shadow-xs print:border-none print:p-0 print:shadow-none">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block print:hidden">2026 Overflow Platform Selector</label>
                          
                          <select value={giaPreference} onChange={(e) => setGiaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-hidden mb-3 bg-slate-50 dark:bg-slate-800 cursor-pointer print:hidden">
                            {state.useHouseholdMode ? (
                              <>
                                <option value="ii">Interactive Investor (Free GIA with ISA)</option>
                                <option value="investEngine">InvestEngine (Best Low-Cost Joint Portfolios)</option>
                              </>
                            ) : (
                              <>
                                <option value="t212">Trading 212 (Zero-Fee Overflow Consolidation)</option>
                                <option value="ibkr">Interactive Brokers (Institutional Grade)</option>
                              </>
                            )}
                          </select>

                          {state.useHouseholdMode && giaPreference === 'ii' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Interactive Investor (ii):</strong> If you are already using ii for your household Stocks & Shares ISA, they include a free General Investment Account as part of your flat monthly fee. This is the most cost-efficient way to hold joint overflow investments without paying extra platform charges.</p>
                          )}
                          {state.useHouseholdMode && giaPreference === 'investEngine' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>InvestEngine:</strong> A fantastic low-cost alternative for joint accounts. They charge zero platform fees for DIY ETF portfolios, making it perfect for parking joint cash overflow into global index funds without dragging on yields.</p>
                          )}
                          {!state.useHouseholdMode && giaPreference === 't212' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Trading 212:</strong> Consolidate your overflow capital here. T212 offers a zero-fee GIA alongside their ISA, allowing you to seamlessly continue buying tech and cybersecurity ETFs without commission.</p>
                          )}
                          {!state.useHouseholdMode && giaPreference === 'ibkr' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed print:text-slate-600"><strong>Interactive Brokers (IBKR):</strong> If your overflow wealth is significant or you require access to complex global markets, margin, and extended-hours trading, IBKR is the institutional-grade standard for experienced professionals.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-right shrink-0 w-full md:w-36 print:border-slate-200">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-500">Monthly Route</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-500 print:text-amber-600">+{formatCurrency(report.waterfall.giaAllocation)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-8 rounded-2xl text-center text-sm text-rose-600 dark:text-rose-400 font-medium print:bg-white print:border-slate-200 print:text-slate-900">
              Your living expenses currently exhaust your calculated monthly take-home. 
            </div>
          )}
        </div>
      </main>
    </div>
  );
}