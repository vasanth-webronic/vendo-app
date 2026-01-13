import { CreditCard, Smartphone, Check } from 'lucide-react';
import { PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PaymentOptionProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (method: PaymentMethod) => void;
}

const paymentIcons = {
  swish: Smartphone,
  card: CreditCard,
};

const paymentLabels = {
  swish: 'Swish',
  card: 'Card',
};

export const PaymentOption = ({ method, selected, onSelect }: PaymentOptionProps) => {
  const Icon = paymentIcons[method];

  return (
    <button
      onClick={() => onSelect(method)}
      className={cn('vm-payment-option w-full', selected && 'selected')}
    >
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      
      <span className="flex-1 text-left font-medium text-foreground">
        {paymentLabels[method]}
      </span>
      
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          selected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30'
        )}
      >
        {selected && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>
    </button>
  );
};
