'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoginViewProps } from '@/tenants/Common/types';
import { useToast } from '@/context/ToastContext';

export default function MayfairCorporateLogin({ portal }: LoginViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const banners = portal.loginBanners || [];

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          portalKey: portal.portalKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes bannerFadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 960px) {
          .login-left-banner-pane {
            display: none !important;
          }
        }
      `}</style>

      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${portal.primaryColor}12 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* LEFT PANE: Mayfair Corporate Hero & Banners */}
      <div
        className="login-left-banner-pane"
        style={{
          flex: '1.25',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          zIndex: 2,
          background: `linear-gradient(135deg, ${portal.primaryColor}08 0%, #f8fafc 100%)`,
          borderRight: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: portal.accentColor,
                boxShadow: `0 0 6px ${portal.accentColor}`,
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
              {portal.brandName} • Corporate HR Portal
            </span>
          </div>
        </div>

        {/* Banner Carousel */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            margin: 'auto 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {banners.length > 0 ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {banners.map((banner, idx) => (
                <div
                  key={banner.src}
                  style={{
                    display: idx === activeBannerIndex ? 'block' : 'none',
                    width: '100%',
                    animation: 'bannerFadeIn 0.4s ease-in-out',
                  }}
                >
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    width={900}
                    height={550}
                    priority
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Corporate Health & Benefit Solutions
              </h1>
              <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>
                Empowering corporate HR leaders to manage company policies, enrollments, and employee welfare with ease.
              </p>
            </div>
          )}

          {banners.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px', alignItems: 'center' }}>
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveBannerIndex(idx)}
                  style={{
                    width: idx === activeBannerIndex ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: idx === activeBannerIndex ? portal.accentColor : '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                  aria-label={`Banner slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '24px' }}>
          {portal.copyright}
        </div>
      </div>

      {/* RIGHT PANE: Mayfair Corporate Login Form Card */}
      <div
        style={{
          flex: '0.9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                padding: '12px 24px',
                borderRadius: '16px',
                marginBottom: '18px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                minHeight: '64px',
              }}
            >
              <Image
                src={portal.logoUrl}
                alt={portal.logoAlt}
                width={160}
                height={48}
                style={{ objectFit: 'contain', width: 'auto', height: '48px', maxWidth: '100%' }}
                priority
              />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Corporate HR Sign In
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Access corporate healthcare administration and employee e-cards
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#b91c1c',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1, marginTop: '1px' }}>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                HR Username / Corporate Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your HR login"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = portal.accentColor;
                  e.target.style.boxShadow = `0 0 0 3px ${portal.accentColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Please contact your Mayfair account manager for HR credentials recovery.', 'HR Support');
                  }}
                  style={{ fontSize: '12px', color: portal.accentColor, fontWeight: 600, textDecoration: 'none' }}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 48px 12px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = portal.accentColor;
                    e.target.style.boxShadow = `0 0 0 3px ${portal.accentColor}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: portal.accentColor, cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                Remember my preferences on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                backgroundColor: portal.accentColor,
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 4px 14px ${portal.accentColor}40`,
                transition: 'all 0.2s ease',
                marginTop: '8px',
              }}
              className={loading ? 'crosslink-btn-loading' : ''}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              {loading ? (
                <>
                  <svg
                    className="crosslink-spinner"
                    style={{ height: '16px', width: '16px' }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.28)" strokeWidth="3.5" />
                    <path
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="50"
                      strokeDashoffset="35"
                      d="M12 2a10 10 0 0 1 10 10"
                    />
                  </svg>
                  <span>Authenticating</span>
                </>
              ) : (
                'Sign in to Corporate Dashboard →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
