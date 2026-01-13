import { ArrowLeft, X, Grid2X2, User, ShoppingCart, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showClose?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  variant?: 'primary' | 'white';
}

export const Header = ({
  title = 'Vending Machine',
  showBack = false,
  showClose = false,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  variant = 'primary',
}: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname.match(/^\/store\/[^/]+$/);

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    router.push('/');
  };

  if (variant === 'white') {
    return (
      <header className="sticky top-0 z-50 bg-card safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          {showBack && (
            <button onClick={handleBack} className="vm-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
            {title}
          </h1>
          
          {showClose && (
            <button onClick={handleClose} className="vm-close-btn">
              <X className="w-5 h-5" />
            </button>
          )}
          
          {!showClose && <div className="w-10" />}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 vm-header safe-top">
      <div className="px-4 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          {isHomePage ? (
            <button className="w-10 h-10 flex items-center justify-center text-primary-foreground/80">
              <Grid2X2 className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
          
          <button className="w-10 h-10 flex items-center justify-center text-primary-foreground/80">
            <User className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="vm-search pl-12"
            />
          </div>
        )}
      </div>
    </header>
  );
};
