"use client";
// This file is kept for reference but is not used.
// The actual page is at src/app/age-verification/page.tsx
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusScreen } from '@/components/ui/StatusScreen';
import { useAppStore } from '@/lib/stores/appStore';
import { Camera, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

type VerificationStep = 'capture' | 'verifying' | 'success' | 'rejected' | 'failed' | 'expired';

const AgeVerificationPage = () => {
  // Navigation removed - use Next.js router in app/age-verification/page.tsx instead
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };
  const { setAgeVerification } = useAppStore();
  const [step, setStep] = useState<VerificationStep>('capture');
  const [idType, setIdType] = useState('National ID');
  const [hasImage, setHasImage] = useState(false);

  const handleCapture = () => {
    setHasImage(true);
  };

  const handleSubmit = () => {
    setStep('verifying');
    
    // Simulate verification process
    setTimeout(() => {
      // 80% success rate for demo
      const random = Math.random();
      if (random > 0.2) {
        setStep('success');
        setAgeVerification({
          status: 'approved',
          idType,
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        
        setTimeout(() => {
          navigate('/payment');
        }, 2000);
      } else if (random > 0.1) {
        setStep('rejected');
        setAgeVerification({ status: 'rejected' });
      } else {
        setStep('failed');
        setAgeVerification({ status: 'failed' });
      }
    }, 3000);
  };

  const handleRetry = () => {
    setStep('capture');
    setHasImage(false);
    setAgeVerification({ status: 'none' });
  };

  const handleRemoveAndContinue = () => {
    // In real app, would remove age-restricted items
    navigate('/cart');
  };

  // Verifying State
  if (step === 'verifying') {
    return (
      <StatusScreen
        showSpinner
        title="Age Verification"
        description="This may take a few minutes. Please do not go back or close the app. Thank you for your patience as we ensure your security."
      />
    );
  }

  // Success State
  if (step === 'success') {
    return (
      <StatusScreen
        icon={CheckCircle}
        iconColor="success"
        title="Age Verification Successful!"
        description="Hang tight, we're redirecting you to continue your purchase…"
      />
    );
  }

  // Rejected State
  if (step === 'rejected') {
    return (
      <StatusScreen
        icon={XCircle}
        iconColor="destructive"
        title="Age Verification Not Approved!"
        description="We regret to inform you that your age verification for purchasing 18+ products was not approved. Please remove the 18+ products from your cart to continue with your purchase."
      >
        <button onClick={handleRemoveAndContinue} className="vm-btn-primary">
          Remove & Continue
        </button>
        <button
          onClick={() => navigate('/cart')}
          className="w-full py-3 text-primary font-medium"
        >
          Back to Cart
        </button>
      </StatusScreen>
    );
  }

  // Failed State
  if (step === 'failed') {
    return (
      <StatusScreen
        icon={AlertTriangle}
        iconColor="warning"
        title="Age Verification Failed!"
        description="We couldn't verify your account. Please ensure that all the details you provided are clear and accurate."
      >
        <button onClick={handleRetry} className="vm-btn-primary">
          Retry
        </button>
        <button className="w-full py-3 text-muted-foreground font-medium">
          Contact Support
        </button>
      </StatusScreen>
    );
  }

  // Expired State
  if (step === 'expired') {
    return (
      <StatusScreen
        icon={Clock}
        iconColor="warning"
        title="Verification Expired!"
        description="We apologize for the inconvenience. Our team was unable to complete your account verification in time."
      >
        <button onClick={handleRetry} className="vm-btn-primary">
          Retry
        </button>
        <button className="w-full py-3 text-muted-foreground font-medium">
          Contact Support
        </button>
      </StatusScreen>
    );
  }

  // Capture State
  return (
    <div className="min-h-screen bg-background">
      <Header title="Age Verification" showBack showClose variant="white" />
      
      <main className="p-4 pb-32">
        {/* ID Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            ID TYPE
          </label>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className="w-full p-4 bg-card rounded-2xl border border-border text-foreground appearance-none cursor-pointer"
          >
            <option>National ID</option>
            <option>Passport</option>
            <option>Driver&apos;s License</option>
          </select>
        </div>
        
        {/* Camera Preview */}
        <div className="relative aspect-[3/4] bg-secondary rounded-2xl overflow-hidden mb-6">
          {hasImage ? (
            <div className="absolute inset-0 bg-gradient-to-b from-secondary to-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-28 bg-card rounded-lg shadow-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">ID Preview</span>
                </div>
                <p className="text-sm text-muted-foreground">Image captured</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Position your ID within the frame</p>
            </div>
          )}
          
          {/* Frame Overlay */}
          <div className="absolute inset-8 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none" />
        </div>
      </main>
      
      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background safe-bottom">
        {hasImage ? (
          <button onClick={handleSubmit} className="vm-btn-primary">
            Submit
          </button>
        ) : (
          <button onClick={handleCapture} className="vm-btn-primary">
            Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default AgeVerificationPage;
