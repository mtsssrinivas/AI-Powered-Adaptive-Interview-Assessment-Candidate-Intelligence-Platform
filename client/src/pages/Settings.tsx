import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { CreditBalance, CreditTransaction } from '@interviewiq/shared';

export const Settings: React.FC = () => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = () => {
    apiClient<CreditBalance>('/credits')
      .then((data) => setBalance(data))
      .catch(() => setBalance(null));

    apiClient<CreditTransaction[]>('/credits/transactions')
      .then((data) => setTransactions(data))
      .catch(() => setTransactions([]));
  };

  const handleBuyCredits = async (planId: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
    setPurchasing(true);
    try {
      const order = await apiClient<any>('/payments/order', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });

      // Verification mock / test flow
      await apiClient('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_verified_signature_dev',
          planId,
        }),
      });

      alert('Credits successfully credited to your ledger!');
      loadCredits();
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Settings & Credit Ledger
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          IMMUTABLE TRANSACTION LOGS · SECURE SIGNED LEDGER
        </p>
      </div>

      {/* Credit Ledger Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Current Balance</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {balance?.currentBalance ?? 100} CR
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Available for interviews</div>
        </Card>

        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Total Earned</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {balance?.totalEarned ?? 100} CR
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Signup grant + purchases</div>
        </Card>

        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Total Utilized</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {balance?.totalSpent ?? 0} CR
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Adaptive session spend</div>
        </Card>
      </div>

      {/* Purchase Tier Options */}
      <Card sectionNumber="01" sectionTitle="PURCHASE ASSESSMENT CREDITS (RAZORPAY SECURE)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded space-y-3 bg-slate-50/50">
            <div className="font-mono text-xs text-slate-500">STARTER PACK</div>
            <div className="text-2xl font-bold font-mono text-slate-900">100 CR</div>
            <div className="text-xs text-slate-600 leading-snug">
              Ideal for ~3 full adaptive interview rounds with AI rubric evaluations.
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">₹499 INR</div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              isLoading={purchasing}
              onClick={() => handleBuyCredits('STARTER')}
            >
              Acquire 100 CR
            </Button>
          </div>

          <div className="p-4 border-2 border-blue-600 rounded space-y-3 bg-blue-50/20">
            <div className="font-mono text-xs text-blue-600 font-semibold">PRO PACK</div>
            <div className="text-2xl font-bold font-mono text-slate-900">500 CR</div>
            <div className="text-xs text-slate-600 leading-snug">
              Full candidate preparation: 15+ interviews, DSA runner, and project defense.
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">₹1,999 INR</div>
            <Button
              size="sm"
              className="w-full"
              isLoading={purchasing}
              onClick={() => handleBuyCredits('PRO')}
            >
              Acquire 500 CR
            </Button>
          </div>

          <div className="p-4 border border-slate-200 rounded space-y-3 bg-slate-50/50">
            <div className="font-mono text-xs text-slate-500">ENTERPRISE PACK</div>
            <div className="text-2xl font-bold font-mono text-slate-900">2,000 CR</div>
            <div className="text-xs text-slate-600 leading-snug">
              Extensive career mastery with persistent longitudinal candidate intelligence.
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">₹6,999 INR</div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              isLoading={purchasing}
              onClick={() => handleBuyCredits('ENTERPRISE')}
            >
              Acquire 2,000 CR
            </Button>
          </div>
        </div>
      </Card>

      {/* Credit Ledger Transactions */}
      <Card sectionNumber="02" sectionTitle="IMMUTABLE CREDIT LEDGER AUDIT">
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs font-mono text-slate-400">
            Initial 100 CR signup bonus credited upon registration.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs font-mono">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{tx.description}</span>
                  <span className="text-slate-400 ml-2">[{tx.type}]</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`font-bold ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CR
                  </span>
                  <span className="text-slate-400">Bal: {tx.balanceAfter} CR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
