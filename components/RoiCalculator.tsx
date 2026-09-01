'use client';

import React, { useState } from 'react';

export default function RoiCalculator() {
  // Calculator inputs
  const [panelCount, setPanelCount] = useState<number>(20);
  const [wattage, setWattage] = useState<number>(450);
  const [soilingLoss, setSoilingLoss] = useState<number>(12);
  const [tariff, setTariff] = useState<number>(3.50);
  const [cleaningCostPerPanel, setCleaningCostPerPanel] = useState<number>(35);

  // Form inputs
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculations
  const systemKw = (panelCount * wattage) / 1000;
  const avgDailyGenerationKw = systemKw * 4.5;
  const monthlyGenerationKwh = avgDailyGenerationKw * 30;
  const monthlyKwhLost = monthlyGenerationKwh * (soilingLoss / 100);
  const monthlyFinancialLoss = monthlyKwhLost * tariff;
  const annualFinancialLoss = monthlyFinancialLoss * 12;
  const totalCleaningCost = panelCount * cleaningCostPerPanel;
  const paybackMonths = monthlyFinancialLoss > 0 ? (totalCleaningCost / monthlyFinancialLoss) : 0;
  const netAnnualSavings = annualFinancialLoss - totalCleaningCost;

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      lead_info: {
        full_name: fullName,
        email: email,
        phone: phone,
        notes: notes,
      },
      calculator_metrics: {
        panel_count: panelCount,
        system_kw: systemKw,
        soiling_loss_pct: soilingLoss,
        monthly_kwh_lost: monthlyKwhLost,
        annual_financial_loss: annualFinancialLoss,
        estimated_cleaning_cost: totalCleaningCost,
        net_annual_savings: netAnnualSavings,
        payback_months: paybackMonths,
      },
      submitted_at: new Date().toISOString(),
    };

    try {
      // Endpoint targeting your Supabase/Next.js API route
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote request.');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Solar Panel Cleaning ROI Calculator
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        See how much dirty panels are costing you and request a targeted cleaning quote instantly.
      </p>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Number of Panels
          </label>
          <input
            type="number"
            value={panelCount}
            onChange={(e) => setPanelCount(Number(e.target.value))}
            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Panel Rating (Watts)
          </label>
          <input
            type="number"
            value={wattage}
            onChange={(e) => setWattage(Number(e.target.value))}
            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Estimated Efficiency Loss (%)
          </label>
          <input
            type="number"
            value={soilingLoss}
            onChange={(e) => setSoilingLoss(Number(e.target.value))}
            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Electricity Rate (R / kWh)
          </label>
          <input
            type="number"
            step="0.10"
            value={tariff}
            onChange={(e) => setTariff(Number(e.target.value))}
            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Metric Breakdown */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">System Size:</span>
          <span className="font-semibold text-slate-900 dark:text-white">{systemKw.toFixed(1)} kWp</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">Monthly Power Lost:</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">-{monthlyKwhLost.toFixed(0)} kWh</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">Annual Value Lost:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">R{annualFinancialLoss.toFixed(2)}</span>
        </div>
        <hr className="border-slate-200 dark:border-slate-700" />
        <div className="flex justify-between items-center">
          <span className="font-medium text-slate-900 dark:text-white">Payback Period:</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {paybackMonths > 0 ? `${paybackMonths.toFixed(1)} Months` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-slate-900 dark:text-white">Net Annual Return:</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            R{netAnnualSavings.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Quote Submission Form */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request an Official Quote</h3>
        
        {isSubmitted ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 text-sm">
            Thank you! Your system parameters have been sent to our team. We will reach out shortly with your customized quote.
          </div>
        ) : (
          <form onSubmit={handleSubmitQuote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="+27 82 123 4567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Roof tilt, site location, etc."
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Request...' : 'Submit Lead & Get Quote'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
