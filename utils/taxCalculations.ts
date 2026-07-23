// src/utils/taxCalculations.ts

export interface PersonProfile {
  grossSalary: number; 
  bonus: number;
  bonusDate: string; 
  employerPensionContribution: number;
  personalPensionContribution: number;
  pensionType: 'salary_sacrifice' | 'relief_at_source';
  studentLoanPlan: 'none' | 'plan_1' | 'plan_2' | 'plan_4' | 'plan_5' | 'postgrad';
  startDate: string; 
  monthlyExpenses: number;
  isScottishResident: boolean; // NEW: Added for Scottish Tax Bands
}

export interface AppState {
  primary: PersonProfile;
}

export interface IndividualTaxBreakdown {
  actualGrossIncome: number;
  adjustedNetIncome: number;
  personalAllowance: number;
  taxCode: string;
  totalTax: number;
  totalNI: number;
  totalPension: number;
  totalTakeHome: number;
  monthsWorked: number;
  firstMonthTakeHome: number;
  normalMonthTakeHome: number;
  bonusMonthTakeHome: number; 
  firstMonthTax: number;
  normalMonthTax: number;
}

export interface WaterfallStrategy {
  disposableIncome: number;
  emergencyTarget: number;
  lisaAllocation: number;
  isaAllocation: number;
  giaAllocation: number;
}

export interface CompleteTaxReport {
  primary: IndividualTaxBreakdown;
  optimisationTips: string[];
  waterfall: WaterfallStrategy;
}

const STANDARD_ALLOWANCE = 12570;
const BASIC_LIMIT = 37700;
const ADDITIONAL_THRESHOLD = 125140;

function getTaxMonth(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const taxYearStart = new Date('2026-04-06');
  if (d <= taxYearStart) return 0; 
  
  const yearDiff = d.getFullYear() - 2026;
  let absoluteMonth = yearDiff * 12 + d.getMonth();
  let taxMonth = absoluteMonth - 3; 
  
  return Math.max(0, Math.min(11, taxMonth)); 
}

function calculateNI(monthlyGross: number): number {
  const primaryThreshold = 1048;
  const upperLimit = 4189;
  if (monthlyGross <= primaryThreshold) return 0;
  if (monthlyGross <= upperLimit) return (monthlyGross - primaryThreshold) * 0.08;
  return ((upperLimit - primaryThreshold) * 0.08) + ((monthlyGross - upperLimit) * 0.02);
}

export function runTaxSimulation(person: PersonProfile): IndividualTaxBreakdown {
  const startMonth = getTaxMonth(person.startDate);
  const bonusMonth = person.bonus > 0 ? getTaxMonth(person.bonusDate) : -1;
  const monthsWorked = 12 - startMonth;
  
  const monthlyGross = person.grossSalary / 12;
  const actualGrossIncome = (monthlyGross * monthsWorked) + person.bonus;

  const monthlyPensionSub = person.pensionType === 'salary_sacrifice' ? person.personalPensionContribution / 12 : 0;
  const actualPensionTotal = (person.personalPensionContribution / 12) * monthsWorked;
  
  const adjustedNetIncome = actualGrossIncome - actualPensionTotal; 

  let personalAllowance = STANDARD_ALLOWANCE;
  if (adjustedNetIncome > 100000) {
    personalAllowance = Math.max(0, STANDARD_ALLOWANCE - Math.floor((adjustedNetIncome - 100000) / 2));
  }
  const taxCode = personalAllowance > 0 ? `${Math.floor(personalAllowance / 10)}L` : '0T';
  if (person.isScottishResident && taxCode !== '0T') {
    // Prefix with 'S' for Scottish tax codes (e.g. S1257L)
    // Note: this is a cosmetic update for the UI, the math relies on the boolean
  }

  let accumulatedGross = 0;
  let accumulatedTaxPaid = 0;
  let totalNI = 0;
  let totalTakeHome = 0;
  
  let firstMonthTakeHome = 0;
  let firstMonthTax = 0;
  let normalMonthTakeHome = 0;
  let normalMonthTax = 0;
  let bonusMonthTakeHome = 0;

  for (let i = 0; i < 12; i++) {
    if (i < startMonth) continue; 
    
    let isBonusMonth = (i === bonusMonth); 
    let currentMonthGross = monthlyGross + (isBonusMonth ? person.bonus : 0);
    let taxableMonthlyGross = currentMonthGross - monthlyPensionSub;

    let monthlyNI = calculateNI(taxableMonthlyGross);
    totalNI += monthlyNI;

    accumulatedGross += taxableMonthlyGross;
    
    let allowanceToDate = personalAllowance * ((i + 1) / 12);
    let basicLimitToDate = BASIC_LIMIT * ((i + 1) / 12);
    let additionalThresholdToDate = ADDITIONAL_THRESHOLD * ((i + 1) / 12);
    
    let taxableToDate = Math.max(0, accumulatedGross - allowanceToDate);
    let higherRateLimitToDate = Math.max(0, additionalThresholdToDate - allowanceToDate);
    
    let taxDueToDate = 0;
    
    if (person.isScottishResident) {
      // 2026/27 Scottish Tax Band Widths
      let starterWidth = 3967 * ((i + 1) / 12);
      let basicWidth = 12989 * ((i + 1) / 12);
      let intermediateWidth = 14136 * ((i + 1) / 12);
      let higherWidth = 31338 * ((i + 1) / 12);
      let advancedWidth = 50140 * ((i + 1) / 12);

      let scotBasicLimit = starterWidth + basicWidth;
      let scotIntLimit = scotBasicLimit + intermediateWidth;
      let scotHigherLimit = scotIntLimit + higherWidth;
      let scotAdvLimit = scotHigherLimit + advancedWidth;

      if (taxableToDate <= starterWidth) {
        taxDueToDate = taxableToDate * 0.19;
      } else if (taxableToDate <= scotBasicLimit) {
        taxDueToDate = (starterWidth * 0.19) + ((taxableToDate - starterWidth) * 0.20);
      } else if (taxableToDate <= scotIntLimit) {
        taxDueToDate = (starterWidth * 0.19) + (basicWidth * 0.20) + ((taxableToDate - scotBasicLimit) * 0.21);
      } else if (taxableToDate <= scotHigherLimit) {
        taxDueToDate = (starterWidth * 0.19) + (basicWidth * 0.20) + (intermediateWidth * 0.21) + ((taxableToDate - scotIntLimit) * 0.42);
      } else if (taxableToDate <= scotAdvLimit) {
        taxDueToDate = (starterWidth * 0.19) + (basicWidth * 0.20) + (intermediateWidth * 0.21) + (higherWidth * 0.42) + ((taxableToDate - scotHigherLimit) * 0.45);
      } else {
        taxDueToDate = (starterWidth * 0.19) + (basicWidth * 0.20) + (intermediateWidth * 0.21) + (higherWidth * 0.42) + (advancedWidth * 0.45) + ((taxableToDate - scotAdvLimit) * 0.48);
      }
    } else {
      if (taxableToDate <= basicLimitToDate) {
        taxDueToDate = taxableToDate * 0.20;
      } else if (taxableToDate <= higherRateLimitToDate) {
        taxDueToDate = (basicLimitToDate * 0.20) + ((taxableToDate - basicLimitToDate) * 0.40);
      } else {
        taxDueToDate = (basicLimitToDate * 0.20) + ((higherRateLimitToDate - basicLimitToDate) * 0.40) + ((taxableToDate - higherRateLimitToDate) * 0.45);
      }
    }

    let taxThisMonth = Math.max(0, taxDueToDate - accumulatedTaxPaid);
    accumulatedTaxPaid += taxThisMonth;

    let reliefAtSourceSub = person.pensionType === 'relief_at_source' ? (person.personalPensionContribution / 12) : 0;
    let takeHomeThisMonth = currentMonthGross - taxThisMonth - monthlyNI - monthlyPensionSub - reliefAtSourceSub;
    totalTakeHome += takeHomeThisMonth;

    if (i === startMonth) {
      firstMonthTakeHome = takeHomeThisMonth;
      firstMonthTax = taxThisMonth;
    }
    if (isBonusMonth) {
      bonusMonthTakeHome = takeHomeThisMonth;
    }
    if (i !== startMonth && !isBonusMonth) {
      normalMonthTakeHome = takeHomeThisMonth;
      normalMonthTax = taxThisMonth;
    }
  }

  if (normalMonthTakeHome === 0) normalMonthTakeHome = firstMonthTakeHome;

  return {
    actualGrossIncome, adjustedNetIncome, personalAllowance, taxCode: person.isScottishResident && personalAllowance > 0 ? `S${taxCode}` : taxCode,
    totalTax: accumulatedTaxPaid, totalNI, totalPension: actualPensionTotal, totalTakeHome,
    monthsWorked, firstMonthTakeHome, normalMonthTakeHome, bonusMonthTakeHome, firstMonthTax, normalMonthTax
  };
}

export function calculateCompleteTaxReport(state: AppState): CompleteTaxReport {
  const baseline = runTaxSimulation(state.primary);
  const tips: string[] = [];

  if (state.primary.personalPensionContribution > 0) {
    const zeroPensionProfile = { ...state.primary, personalPensionContribution: 0 };
    const zeroPensionResult = runTaxSimulation(zeroPensionProfile);
    const takeHomeIncrease = zeroPensionResult.normalMonthTakeHome - baseline.normalMonthTakeHome;
    const taxIncrease = zeroPensionResult.totalTax - baseline.totalTax;
    
    tips.push(`**Immediate Pay Rise:** You are sacrificing into your pension. If you reduce your pension contribution to £0, your normal monthly take-home pay will instantly **increase by £${Math.round(takeHomeIncrease).toLocaleString()}** (putting exactly £${Math.round(zeroPensionResult.normalMonthTakeHome).toLocaleString()} in your pocket each month). *Warning: You will pay £${Math.round(taxIncrease).toLocaleString()} more in tax annually to do this.*`);
  }

  if (baseline.adjustedNetIncome > 100000 && baseline.adjustedNetIncome < 125140) {
    const excess = baseline.adjustedNetIncome - 100000;
    const trapProfile = { ...state.primary, personalPensionContribution: state.primary.personalPensionContribution + excess };
    const trapResult = runTaxSimulation(trapProfile);
    const takeHomeCostPerMonth = baseline.normalMonthTakeHome - trapResult.normalMonthTakeHome;

    tips.push(`**Escape the £100k Trap:** You are losing your tax-free allowance because you earn £${Math.round(excess).toLocaleString()} over the £100k threshold. If you increase your pension slider by exactly **£${Math.round(excess).toLocaleString()}**, you recover your full tax code. This will only reduce your monthly take-home pay by **£${Math.round(takeHomeCostPerMonth).toLocaleString()}**, but it adds thousands to your pension pot tax-free.`);
  }

  if (state.primary.bonus > 0) {
    const noBonusProfile = { ...state.primary, bonus: 0 };
    const noBonusResult = runTaxSimulation(noBonusProfile);
    const taxOnBonus = baseline.totalTax - noBonusResult.totalTax;
    const niOnBonus = baseline.totalNI - noBonusResult.totalNI;
    const totalDeductions = taxOnBonus + niOnBonus;
    const keepPercentage = Math.round(100 - ((totalDeductions / state.primary.bonus) * 100));

    tips.push(`**Bonus Tax Warning:** You are getting a £${state.primary.bonus.toLocaleString()} bonus in ${new Date(state.primary.bonusDate).toLocaleString('default', { month: 'long' })}. You will lose **£${Math.round(totalDeductions).toLocaleString()}** of it to Tax and NI (keeping only ${keepPercentage}%). To avoid this, ask your employer to pay this bonus directly into your pension as an 'Employer Contribution' to keep 100% of the money.`);
  }

  if (tips.length === 0) {
    tips.push(`**Optimised Status:** Your income is highly tax-efficient. You have zero pre-tax deductions limiting your monthly take-home pay.`);
  }

  const expenses = state.primary.monthlyExpenses || 0;
  const disposableIncome = baseline.normalMonthTakeHome - expenses;
  let remainingCash = Math.max(0, disposableIncome);

  const lisaAllocation = Math.min(remainingCash, 333);
  remainingCash -= lisaAllocation;

  const isaAllocation = Math.min(remainingCash, 1333);
  remainingCash -= isaAllocation;

  const giaAllocation = remainingCash;

  const waterfall: WaterfallStrategy = {
    disposableIncome,
    emergencyTarget: expenses * 3, 
    lisaAllocation,
    isaAllocation,
    giaAllocation
  };

  return { primary: baseline, optimisationTips: tips, waterfall };
}