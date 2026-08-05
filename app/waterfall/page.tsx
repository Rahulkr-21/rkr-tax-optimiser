'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, TaxConfig, calculateCompleteTaxReport } from '../../utils/taxCalculations';
import Link from 'next/link';

export default function WaterfallPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  
  // Custom interactive states
  const [emergencyFundFilled, setEmergencyFundFilled] = useState(false);
  const [isaPreference, setIsaPreference] = useState<'fixed' | 'diy' | 'robo' | 'vanguard'>('diy');
  const [emergencyPreference, setEmergencyPreference] = useState<'joint' | 'yield' | 'cashIsa' | 'bonds'>('yield');
  const [giaPreference, setGiaPreference] = useState<'ii' | 'investEngine' | 't212' | 'ibkr'>('t212');
  
  const [state, setState] = useState<AppState>({
    primary: { grossSalary: 42000, bonus: 0, bonusDate: '2026-12-20', employerPensionContribution: 0, personalPensionContribution: 3300, pensionType: 'salary_sacrifice', studentLoanPlan: 'none', startDate: '2026-04-06', monthlyExpenses: 0, isScottishResident: false },
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
    
    const savedData = localStorage.getItem('rkr_tax_state_v4');
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        if (parsed.state) setState(parsed.state);
        else setState(parsed); 
        
        if (parsed.emergencyFundFilled !== undefined) setEmergencyFundFilled(parsed.emergencyFundFilled);
        if (parsed.giaPreference) setGiaPreference(parsed.giaPreference);
      } catch (e) {}
    }
    
    fetchConfig().then(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) {
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
  }, [state, emergencyFundFilled, giaPreference, isLoaded]);

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
          <span className="text-xs bg-indigo-50 font-semibold px-3 py-2 rounded-full text-indigo-600 border border-indigo-100 hidden md:inline-block">UK Investment Wrappers 2026/27</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* STRATEGY CONTROLS */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Strategy Configuration</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useHouseholdMode || false} onChange={(e) => setState(p => ({ ...p, useHouseholdMode: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
              <span className="text-sm font-semibold text-slate-700">Enable Dual-Income Household Mode</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.useLISA !== false} onChange={(e) => setState(p => ({ ...p, useLISA: e.target.checked }))} className="w-5 h-5 text-indigo-600 rounded" />
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
              
              {/* Step 1: Emergency Fund (INTERACTIVE) */}
              <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative transition duration-300 ${emergencyFundFilled ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1 transition ${emergencyFundFilled ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>1</div>
                    
                    <div className="flex-1 pr-0 md:pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-sm ${emergencyFundFilled ? 'text-emerald-900' : 'text-slate-800'}`}>Build Emergency Fund</h3>
                        <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50 transition">
                          <input 
                            type="checkbox" 
                            checked={emergencyFundFilled} 
                            onChange={(e) => setEmergencyFundFilled(e.target.checked)} 
                            className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer" 
                          />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Completed</span>
                        </label>
                      </div>

                      {emergencyFundFilled ? (
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed font-medium">
                          Excellent work. Your safety net is fully funded. 100% of your monthly surplus is now aggressively cascading past this step directly into your investment wrappers.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed mb-5">Before investing, maintain highly liquid capital to securely cover immediate lifestyle overheads or upcoming transition costs.</p>

                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">2026 Liquid Storage Options</label>
                            
                            {state.useHouseholdMode ? (
                              <select value={emergencyPreference} onChange={(e) => setEmergencyPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                                <option value="joint">Monzo / Starling (Best for Household Pooling)</option>
                                <option value="bonds">NS&I Premium Bonds (Best for Tax-Free Safety)</option>
                              </select>
                            ) : (
                              <select value={emergencyPreference} onChange={(e) => setEmergencyPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                                <option value="yield">Chase UK / Chip (Best for High-Yield Easy Access)</option>
                                <option value="cashIsa">Trading 212 Cash ISA (Best for Shielding Interest)</option>
                              </select>
                            )}

                            {state.useHouseholdMode && emergencyPreference === 'joint' && (
                              <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://monzo.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Monzo</a> / <a href="https://www.starlingbank.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Starling</a>:</strong> The optimal choice for transparently tracking dual-income ledgers and managing shared apartment overheads. You can securely ring-fence transition capital for your October relocation to Edinburgh in dedicated "Spaces" while keeping it instantly accessible.</p>
                            )}
                            {state.useHouseholdMode && emergencyPreference === 'bonds' && (
                              <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.nsandi.com/products/premium-bonds" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Premium Bonds</a>:</strong> Backed by HM Treasury. Instead of earning standard interest (which couples with high combined savings could be taxed on), you are entered into a monthly tax-free prize draw. Highly secure for large pooled emergency funds.</p>
                            )}
                            {!state.useHouseholdMode && emergencyPreference === 'yield' && (
                              <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.chase.co.uk/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Chase UK</a> / <a href="https://www.getchip.uk/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Chip</a>:</strong> Consistently hovering around the top of the easy-access interest rate tables. Perfect for generating a solid yield on the capital you need to keep liquid for your upcoming structural relocation to Scotland this October.</p>
                            )}
                            {!state.useHouseholdMode && emergencyPreference === 'cashIsa' && (
                              <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.trading212.com/cards/cash-isa" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Trading 212 Cash ISA</a>:</strong> If your cash savings generate more than £500-£1000 in interest this year, standard accounts will trigger tax. This fully protects your safety net from taxation while offering instant withdrawals.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`bg-white px-4 py-2.5 rounded-xl border text-right shrink-0 w-full md:w-36 transition ${emergencyFundFilled ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <span className={`block text-[9px] font-bold uppercase tracking-wider ${emergencyFundFilled ? 'text-emerald-500' : 'text-slate-400'}`}>Safety Target</span>
                  <span className={`font-mono font-bold ${emergencyFundFilled ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {emergencyFundFilled ? 'ACHIEVED' : formatCurrency(report.waterfall.emergencyTarget)}
                  </span>
                </div>
              </div>

              {/* Step 2: LISA */}
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
              <div className={`border p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative transition ${report.waterfall.isaAllocation > 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1 ${report.waterfall.isaAllocation > 0 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>{state.useLISA ? '3' : '2'}</div>
                    <div className="flex-1 pr-0 md:pr-4">
                      <h3 className="font-bold text-slate-800 text-sm">Stocks & Shares ISA</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed mb-5">Deploy remaining cash into markets. Capital gains are 100% shielded from tax forever. {state.useHouseholdMode ? 'Pooled household max: £40,000/year.' : 'Max £20,000/year.'}</p>
                      
                      <div className="bg-white p-4 rounded-xl border border-blue-100/70 shadow-xs">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">2026 Platform Selector</label>
                        
                        {state.useHouseholdMode ? (
                          <select value={isaPreference} onChange={(e) => setIsaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                            <option value="fixed">Interactive Investor (Best for Joint Accounts & High Net Worth)</option>
                            <option value="robo">Wealthify (Best for Hands-off Managed Portfolios)</option>
                          </select>
                        ) : (
                          <select value={isaPreference} onChange={(e) => setIsaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                            <option value="diy">Trading 212 (Best for Zero-Fee Custom Portfolios)</option>
                            <option value="vanguard">Vanguard UK (Best for Passive Low-Cost Indexing)</option>
                          </select>
                        )}

                        {state.useHouseholdMode && isaPreference === 'fixed' && (
                          <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.ii.co.uk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Interactive Investor (ii)</a>:</strong> When combining finances, a flat-fee broker is mathematically optimal. The monthly cost stays static regardless of how large the pooled portfolio grows, providing a rigorous structure for maximizing dual tax efficiency.</p>
                        )}
                        {state.useHouseholdMode && isaPreference === 'robo' && (
                          <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.wealthify.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Wealthify</a>:</strong> Highly effective if demanding professional schedules require a hands-off approach to joint wealth building. Their algorithms handle all asset allocation based on a shared risk profile.</p>
                        )}
                        {!state.useHouseholdMode && isaPreference === 'diy' && (
                          <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.trading212.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Trading 212</a>:</strong> A top choice for absolute control. Perfect if you want to deploy capital strategically and heavily weight your portfolio towards cybersecurity ETFs and tech stocks without paying any commission fees.</p>
                        )}
                        {!state.useHouseholdMode && isaPreference === 'vanguard' && (
                          <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.vanguardinvestor.co.uk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vanguard UK</a>:</strong> The industry standard for a "fire and forget" strategy. Exceptionally low platform fees designed purely for consistently buying into global index funds.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-right shrink-0 w-full md:w-36">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Route</span>
                  <span className="font-mono font-bold text-emerald-600">+{formatCurrency(report.waterfall.isaAllocation)}</span>
                </div>
              </div>

              {/* Step 4: GIA */}
              {report.waterfall.giaAllocation > 0 && (
                <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 relative">
                  <div className="flex-1 w-full">
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 bg-amber-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-1">{state.useLISA ? '4' : '3'}</div>
                      <div className="flex-1 pr-0 md:pr-4">
                        <h3 className="font-bold text-amber-900 text-sm">General Investment Account (GIA)</h3>
                        <p className="text-xs text-amber-700 mt-0.5 max-w-xl leading-relaxed mb-5">Your surplus cash has saturated your entire annual ISA allowance limits. Direct the overflow here.</p>

                        {/* NEW GIA DROPDOWN */}
                        <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-xs">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">2026 Overflow Platform Selector</label>
                          
                          {state.useHouseholdMode ? (
                            <select value={giaPreference} onChange={(e) => setGiaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                              <option value="ii">Interactive Investor (Free GIA with ISA)</option>
                              <option value="investEngine">InvestEngine (Best Low-Cost Joint Portfolios)</option>
                            </select>
                          ) : (
                            <select value={giaPreference} onChange={(e) => setGiaPreference(e.target.value as any)} className="w-full text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-hidden mb-3 bg-slate-50 cursor-pointer">
                              <option value="t212">Trading 212 (Zero-Fee Overflow Consolidation)</option>
                              <option value="ibkr">Interactive Brokers (Institutional Grade / Complex Markets)</option>
                            </select>
                          )}

                          {state.useHouseholdMode && giaPreference === 'ii' && (
                            <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.ii.co.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Interactive Investor (ii)</a>:</strong> If you are already using ii for your household Stocks & Shares ISA, they include a free General Investment Account as part of your flat monthly fee. This is the most cost-efficient way to hold joint overflow investments without paying extra platform charges.</p>
                          )}
                          {state.useHouseholdMode && giaPreference === 'investEngine' && (
                            <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://investengine.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">InvestEngine</a>:</strong> A fantastic low-cost alternative for joint accounts. They charge zero platform fees for DIY ETF portfolios, making it perfect for parking joint cash overflow into global index funds without dragging on yields.</p>
                          )}
                          {!state.useHouseholdMode && giaPreference === 't212' && (
                            <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.trading212.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Trading 212</a>:</strong> Consolidate your overflow capital here. T212 offers a zero-fee GIA alongside their ISA, allowing you to seamlessly continue buying tech and cybersecurity ETFs without commission.</p>
                          )}
                          {!state.useHouseholdMode && giaPreference === 'ibkr' && (
                            <p className="text-xs text-slate-500 leading-relaxed"><strong><a href="https://www.interactivebrokers.co.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Interactive Brokers (IBKR)</a>:</strong> If your overflow wealth is significant or you require access to complex global markets, margin, and extended-hours trading, IBKR is the institutional-grade standard for experienced professionals.</p>
                          )}
                        </div>
                      </div>
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