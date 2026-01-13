'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/stores/appStore';
import { formatDate, formatTime, formatPriceDecimal } from '@/lib/utils/formatters';
import { Download, CheckCircle } from 'lucide-react';
import { TaxBreakdown } from '@/lib/types';

export default function ReceiptPage() {
  const router = useRouter();
  const { currentOrder, setCurrentOrder, setSelectedPaymentMethod } = useAppStore();

  useEffect(() => {
    if (!currentOrder) {
      router.push('/');
    }
  }, [currentOrder, router]);

  if (!currentOrder) {
    return null;
  }

  // Calculate tax breakdown
  const taxBreakdowns: TaxBreakdown[] = [];
  const taxGroups: { [key: number]: { taxRate: number; total: number } } = {};
  
  currentOrder.items.forEach((item) => {
    if (!taxGroups[item.taxRate]) {
      taxGroups[item.taxRate] = { taxRate: item.taxRate, total: 0 };
    }
    taxGroups[item.taxRate].total += item.price * item.quantity;
  });

  Object.values(taxGroups).forEach((group) => {
    const includingTax = group.total;
    const taxMultiplier = group.taxRate / (100 + group.taxRate);
    const taxAmount = includingTax * taxMultiplier;
    const excludingTax = includingTax - taxAmount;
    
    taxBreakdowns.push({
      taxRate: group.taxRate,
      taxAmount,
      excludingTax,
      includingTax,
    });
  });

  const handleDone = () => {
    setCurrentOrder(null);
    setSelectedPaymentMethod(null);
    router.push('/');
  };

  const handleDownload = () => {
    // In real app, would generate PDF receipt
    alert('Receipt download would be implemented here');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Success Header */}
      <div className="text-center mb-6 pt-8">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Purchase Complete!</h1>
        <p className="text-muted-foreground">Thank you for shopping with us!</p>
      </div>
      
      {/* Receipt Card */}
      <div className="vm-receipt mb-6">
        <div className="text-center border-b border-dashed border-border pb-4 mb-4">
          <h2 className="text-lg font-bold text-foreground">RECEIPT</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(currentOrder.paymentDate)}
          </p>
        </div>
        
        {/* Total */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">TOTAL</p>
          <p className="text-3xl font-bold text-foreground">
            {currentOrder.totalAmount} SEK
          </p>
        </div>
        
        {/* Items */}
        <div className="space-y-2 mb-6 border-b border-dashed border-border pb-4">
          {currentOrder.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-foreground uppercase">
                {item.name} x{item.quantity}
              </span>
              <span className="text-foreground">
                {item.price * item.quantity} SEK
              </span>
            </div>
          ))}
          {/* Deposit (Pant) */}
          {currentOrder.items.some((item) => item.depositAmount) && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground">PANT x{currentOrder.items.filter(i => i.depositAmount).length}</span>
              <span className="text-foreground">
                {currentOrder.items.reduce((sum, i) => sum + (i.depositAmount || 0) * i.quantity, 0)} SEK
              </span>
            </div>
          )}
        </div>
        
        {/* Tax Breakdown */}
        <div className="mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-1">TAX%</th>
                <th className="text-right py-1">TAX AMOUNT</th>
                <th className="text-right py-1">EXCL. TAX</th>
                <th className="text-right py-1">INCL. TAX</th>
              </tr>
            </thead>
            <tbody>
              {taxBreakdowns.map((tax, index) => (
                <tr key={index} className="text-foreground">
                  <td className="py-1">{tax.taxRate}%</td>
                  <td className="text-right">{formatPriceDecimal(tax.taxAmount)}</td>
                  <td className="text-right">{formatPriceDecimal(tax.excludingTax)}</td>
                  <td className="text-right">{formatPriceDecimal(tax.includingTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Payment Info */}
        <div className="border-t border-dashed border-border pt-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">PAYMENT</span>
            <span className="text-success font-medium">PAID</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentOrder.paymentMethod === 'swish' ? 'Swish' : 'Card'}{' '}
            {formatTime(currentOrder.paymentDate)}{' '}
            {formatDate(currentOrder.paymentDate)}
          </div>
        </div>
        
        {/* Reference */}
        <div className="text-center text-xs text-muted-foreground">
          <p>REF NO. {currentOrder.referenceNumber}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-4 bg-secondary text-foreground font-medium rounded-full"
        >
          <Download className="w-5 h-5" />
          Download Receipt
        </button>
        
        <button onClick={handleDone} className="vm-btn-primary">
          Done
        </button>
      </div>
    </div>
  );
}
