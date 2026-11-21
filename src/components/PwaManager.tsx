'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    } else if ('serviceWorker' in navigator) {
      // In development, also register to allow installability testing
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[PWA-Dev] Service Worker active:', reg.scope))
        .catch((err) => console.warn('[PWA-Dev] SW registration notice:', err));
    }

    // 4. Capture native browser install prompt (Android Chrome, Edge, Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured and ready');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] HabitFlow successfully installed as standalone app!');
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    // 5. Global trigger to install app from sidebar or buttons
    const handleTriggerInstall = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User choice outcome:', outcome);
        if (outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } else if (isIosDevice && !isStandaloneMode) {
        setShowIosPrompt(true);
      } else {
        alert("To install HabitFlow on your phone: Tap your browser's menu (⋮ or Share) and select 'Install app' or 'Add to Home Screen'.");
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('habitflow:trigger-install', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('habitflow:trigger-install', handleTriggerInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosPrompt(true);
    }
  };

  // If already running standalone or dismissed, don't show the bottom banner
  if (isStandalone || bannerDismissed) return null;

  return (
    <>
      {/* 📱 Android / Desktop Install Prompt Banner */}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="glass-card p-4 rounded-2xl border border-blue-500/40 shadow-2xl bg-zinc-900/95 backdrop-blur-xl flex items-center justify-between gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Install HabitFlow App
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Standalone
                  </span>
                </h4>
                <p className="text-xs text-zinc-400">Install to your home screen for full-screen offline experience.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Install</span>
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍏 iOS Safari Installation Helper Modal */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm p-6 rounded-2xl border border-zinc-700 shadow-2xl bg-zinc-900/95 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-zinc-400">Add as a true Standalone App</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosPrompt(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-medium text-white flex items-center gap-1.5">
                    Tap the Share Button <Share size={14} className="text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Located at the bottom of Safari on iPhone or top on iPad.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-medium text-white flex items-center gap-1.5">
                    Select "Add to Home Screen" <PlusSquare size={14} className="text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Scroll down in the share menu and tap <strong>Add to Home Screen</strong>.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowIosPrompt(false)}
                className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
