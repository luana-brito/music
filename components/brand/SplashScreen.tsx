'use client';

import React, { useEffect, useState } from 'react';

const SPLASH_KEY = 'hype-splash-shown';
const SPLASH_MS = 5000;
const FADE_MS = 300;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [staticMotion, setStaticMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SPLASH_KEY)) {
      setVisible(false);
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStaticMotion(reduced);
    setVisible(true);

    const fadeTimer = window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(() => {
        sessionStorage.setItem(SPLASH_KEY, '1');
        setVisible(false);
      }, reduced ? 0 : FADE_MS);
    }, SPLASH_MS);

    return () => window.clearTimeout(fadeTimer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash${exiting ? ' splash--exit' : ''}${staticMotion ? ' splash--static' : ''}`} role="dialog" aria-label="Hype" aria-modal="true">
      <div className="splash__glow" />
      <img src="/brand/hype-logo.png" alt="Hype" className="splash__logo" />
      <p className="splash__tagline">NINGUEM QUER MAIS QUE A GENTE</p>
      <div className="splash__progress">
        <div className="splash__progress-fill" />
      </div>
    </div>
  );
}
