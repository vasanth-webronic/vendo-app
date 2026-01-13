'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Debug logging
    const debugLog: string[] = [];
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      debugLog.push('✓ Already installed (standalone mode)');
      setDebugInfo(debugLog.join('\n'));
      return;
    }

    // Check if running as standalone (iOS)
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      debugLog.push('✓ Already installed (iOS standalone)');
      setDebugInfo(debugLog.join('\n'));
      return;
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      debugLog.push('✓ Service Worker supported');
    } else {
      debugLog.push('✗ Service Worker NOT supported');
    }

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      debugLog.push(`✓ Manifest link found: ${manifestLink.getAttribute('href')}`);
    } else {
      debugLog.push('✗ Manifest link NOT found');
    }

    // Check icons
    const checkIcons = async () => {
      try {
        const icon192 = await fetch('/icon-192.png', { method: 'HEAD' });
        const icon512 = await fetch('/icon-512.png', { method: 'HEAD' });
        if (icon192.ok) {
          debugLog.push('✓ icon-192.png exists');
        } else {
          debugLog.push('✗ icon-192.png MISSING (404)');
        }
        if (icon512.ok) {
          debugLog.push('✓ icon-512.png exists');
        } else {
          debugLog.push('✗ icon-512.png MISSING (404)');
        }
        setDebugInfo(debugLog.join('\n'));
      } catch (e) {
        debugLog.push('✗ Error checking icons');
        setDebugInfo(debugLog.join('\n'));
      }
    };
    checkIcons();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      debugLog.push('✓ beforeinstallprompt event received');
      setDebugInfo(debugLog.join('\n'));
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      debugLog.push('✓ App installed');
      setDebugInfo(debugLog.join('\n'));
    });

    // Log debug info after a delay
    setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        debugLog.push('⚠️ Install prompt not available yet');
        debugLog.push('Common reasons:');
        debugLog.push('1. Missing PNG icons (icon-192.png, icon-512.png)');
        debugLog.push('2. Running in development mode (service worker disabled)');
        debugLog.push('3. Not on HTTPS/localhost');
        debugLog.push('4. Browser doesn\'t support PWA');
        setDebugInfo(debugLog.join('\n'));
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if dismissed or already installed
  if (isInstalled || !showPrompt || !deferredPrompt) {
    // Show debug info in development
    if (process.env.NODE_ENV === 'development' && debugInfo) {
      return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-4 text-xs max-h-64 overflow-auto">
          <strong>PWA Debug Info:</strong>
          <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      );
    }
    return null;
  }

  // Check if user dismissed it in this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:w-96">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Install Vamo Store</h3>
          <p className="text-sm text-muted-foreground">
            Install our app for a better experience with offline support and faster access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
