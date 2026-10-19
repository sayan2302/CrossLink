'use client';

import React from 'react';

export type PortalIconType =
  | 'insights'
  | 'ecard'
  | 'medical'
  | 'profile'
  | 'policy'
  | 'upload'
  | 'claims'
  | 'members'
  | 'claimsubmission'
  | 'clientdetails'
  | 'policylist';

interface PortalCardIconProps {
  componentId: string;
  componentName?: string;
  accentColor?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function resolveIconType(componentId: string, componentName?: string): PortalIconType {
  const normalizedId = componentId.toLowerCase();
  const normalizedName = (componentName || '').toLowerCase();
  const combined = `${normalizedId} ${normalizedName}`;

  if (combined.includes('claimsubmission') || combined.includes('claim submission') || combined.includes('submit claim')) {
    return 'claimsubmission';
  }
  if (combined.includes('clientdetail') || combined.includes('client details')) {
    return 'clientdetails';
  }
  if (combined.includes('policylist') || combined.includes('policy list') || combined.includes('beneficiar') || combined.includes('endorsement')) {
    return 'policylist';
  }
  if (combined.includes('memberdashboard') || combined.includes('member dashboard')) {
    return 'members';
  }
  if (combined.includes('ecard') || combined.includes('e-card') || combined.includes('download-card')) {
    return 'ecard';
  }
  if (combined.includes('provider') || combined.includes('hospital') || combined.includes('medical') || combined.includes('clinic')) {
    return 'medical';
  }
  if (combined.includes('upload') || combined.includes('enrol') || combined.includes('import')) {
    return 'upload';
  }
  if (combined.includes('claim') || combined.includes('pre-auth') || combined.includes('preauth')) {
    return 'claims';
  }
  if (combined.includes('profile') || combined.includes('account') || combined.includes('user details')) {
    return 'profile';
  }
  if (combined.includes('policy') || combined.includes('coverage') || combined.includes('benefit')) {
    return 'policy';
  }
  if (combined.includes('insight') || combined.includes('metric') || combined.includes('fti') || combined.includes('loss ratio')) {
    return 'insights';
  }

  return 'insights';
}

export default function PortalCardIcon({
  componentId,
  componentName,
  accentColor = '#0284c7',
  width = '100%',
  height = 88,
  className = ''
}: PortalCardIconProps) {
  const iconType = resolveIconType(componentId, componentName);
  const pfx = 'pci-' + componentId.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className={`portal-icon-wrapper ${className}`}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accentColor,
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden'
      }}
    >
      <svg
        viewBox="0 0 168 84"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="portal-card-svg"
      >
        <defs>
          {/* Luminous Ambient Background Aura */}
          <radialGradient id={`${pfx}-ambientAura`} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.14" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>

          {/* Saturated High-Vibrancy Brand Accent Linear Gradient */}
          <linearGradient id={`${pfx}-accentGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
            <stop offset="65%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
          </linearGradient>

          {/* Midnight Obsidian Volumetric 3D Shading Gradient */}
          <linearGradient id={`${pfx}-accentDark`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
          </linearGradient>

          {/* Illuminated Specular Diamond Top Facet */}
          <linearGradient id={`${pfx}-topFacet`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.8" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.45" />
          </linearGradient>

          {/* Frosted Translucent Acrylic Glassmorphism Surface */}
          <linearGradient id={`${pfx}-glassGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.6" />
          </linearGradient>

          {/* Iridescent Crystalline Blue Chromatic Security Foil */}
          <linearGradient id={`${pfx}-holoFoil`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#60a5fa" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
          </linearGradient>

          {/* Luminous Celestial Azure & Ice-Platinum Foil Gradient */}
          <linearGradient id={`${pfx}-goldFoil`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="30%" stopColor="#7dd3fc" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Electric Sky-Blue & Cyan Telemetry Gradient */}
          <linearGradient id={`${pfx}-emeraldGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* High-Precision Laser Glow Filter */}
          <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Volumetric Drop Shadow Filter */}
          <filter id={`${pfx}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* =========================================================================
            1. INSIGHTS & HEALTH METRICS / FTI DASHBOARD (3D Volumetric Rounded Capsule Pillars)
            ========================================================================= */}
        {iconType === 'insights' && (
          <g className="icon-group-insights">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="86" cy="42" rx="48" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Smooth Rounded Isometric Coordinate Floor Curves (Zero Sharp Diamond Chevrons) */}
            <g opacity="0.4">
              <path d="M14 66 C44 78, 124 78, 154 66" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M26 56 C50 67, 118 67, 142 56" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M38 46 C56 55, 112 55, 130 46" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="84" y1="76" x2="84" y2="40" stroke="#cbd5e1" strokeDasharray="3 3" strokeLinecap="round" />
              <line x1="46" y1="53" x2="46" y2="59" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="43" y1="56" x2="49" y2="56" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="122" y1="53" x2="122" y2="59" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="119" y1="56" x2="125" y2="56" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Floating 3D Telemetry Glass Pill on upper right */}
            <g className="portal-anim-metric-chip" filter={`url(#${pfx}-shadow)`}>
              <rect x="110" y="10" width="46" height="20" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="120" cy="20" r="3.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <path d="M128 21 Q 133 16, 138 21 T 148 16" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="148" cy="16" r="2" fill="#06b6d4" />
            </g>

            {/* Volumetric 3D Rounded Capsule Pillar 1 */}
            <g className="portal-anim-bar portal-anim-bar-1" filter={`url(#${pfx}-shadow)`}>
              <rect x="44" y="44" width="13" height="24" rx="6.5" fill={`url(#${pfx}-accentGrad)`} stroke={accentColor} strokeWidth="1.2" />
              {/* Glossy Curved Highlight Pill */}
              <rect x="45.5" y="46" width="3" height="12" rx="1.5" fill="#ffffff" fillOpacity="0.75" />
              {/* Soft Volumetric Curved Obsidian Shadow */}
              <rect x="50.5" y="46" width="5" height="19" rx="2.5" fill={`url(#${pfx}-accentDark)`} opacity="0.45" />
              {/* Luminous Specular Dome Top Cap */}
              <ellipse cx="50.5" cy="47" rx="4.5" ry="2.2" fill="#ffffff" fillOpacity="0.8" />
            </g>

            {/* Volumetric 3D Rounded Capsule Pillar 2 */}
            <g className="portal-anim-bar portal-anim-bar-2" filter={`url(#${pfx}-shadow)`}>
              <rect x="64" y="32" width="13" height="36" rx="6.5" fill={`url(#${pfx}-accentGrad)`} stroke={accentColor} strokeWidth="1.2" />
              {/* Glossy Curved Highlight Pill */}
              <rect x="65.5" y="34" width="3" height="18" rx="1.5" fill="#ffffff" fillOpacity="0.75" />
              {/* Soft Volumetric Curved Obsidian Shadow */}
              <rect x="70.5" y="34" width="5" height="31" rx="2.5" fill={`url(#${pfx}-accentDark)`} opacity="0.45" />
              {/* Luminous Specular Dome Top Cap */}
              <ellipse cx="70.5" cy="35" rx="4.5" ry="2.2" fill="#ffffff" fillOpacity="0.8" />
            </g>

            {/* Volumetric 3D Rounded Capsule Pillar 3 (Peak Hero) */}
            <g className="portal-anim-bar portal-anim-bar-3" filter={`url(#${pfx}-shadow)`}>
              <rect x="84" y="18" width="15" height="50" rx="7.5" fill={`url(#${pfx}-accentGrad)`} stroke={accentColor} strokeWidth="1.2" />
              {/* Glossy Curved Highlight Pill */}
              <rect x="85.5" y="21" width="3.5" height="28" rx="1.75" fill="#ffffff" fillOpacity="0.8" />
              {/* Soft Volumetric Curved Obsidian Shadow */}
              <rect x="91.5" y="21" width="6" height="43" rx="3" fill={`url(#${pfx}-accentDark)`} opacity="0.45" />
              {/* Luminous Specular Dome Top Cap */}
              <ellipse cx="91.5" cy="22" rx="5.5" ry="2.8" fill="#ffffff" />
            </g>

            {/* Volumetric 3D Rounded Capsule Pillar 4 */}
            <g className="portal-anim-bar portal-anim-bar-4" filter={`url(#${pfx}-shadow)`}>
              <rect x="108" y="36" width="13" height="32" rx="6.5" fill={`url(#${pfx}-accentGrad)`} stroke={accentColor} strokeWidth="1.2" />
              {/* Glossy Curved Highlight Pill */}
              <rect x="109.5" y="38" width="3" height="16" rx="1.5" fill="#ffffff" fillOpacity="0.75" />
              {/* Soft Volumetric Curved Obsidian Shadow */}
              <rect x="114.5" y="38" width="5" height="27" rx="2.5" fill={`url(#${pfx}-accentDark)`} opacity="0.45" />
              {/* Luminous Specular Dome Top Cap */}
              <ellipse cx="114.5" cy="39" rx="4.5" ry="2.2" fill="#ffffff" fillOpacity="0.8" />
            </g>

            {/* Glowing 3D Neon Spline Curve with Colored Drop Shadow */}
            <path
              d="M32 60 C52 44, 68 36, 84 28 C92 24, 114 18, 136 30"
              stroke={accentColor}
              strokeWidth="4.5"
              strokeOpacity="0.25"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="portal-anim-trendline"
              d="M32 58 C52 42, 68 34, 84 26 C92 22, 114 16, 136 28"
              stroke="#38bdf8"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter={`url(#${pfx}-glow)`}
            />

            {/* Target Beacon Sphere with Pulse Ring */}
            <g className="portal-anim-trend-node">
              <circle cx="100" cy="20" r="8" fill="#38bdf8" fillOpacity="0.3" filter={`url(#${pfx}-glow)`} />
              <circle cx="100" cy="20" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
            </g>
          </g>
        )}

        {/* =========================================================================
            2. DOWNLOAD E-CARDS (3D Holographic Perspective Smart Card)
            ========================================================================= */}
        {iconType === 'ecard' && (
          <g className="icon-group-ecard">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="88" cy="42" rx="48" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Secondary Fanned Cyber Policy Card in Background */}
            <g transform="rotate(-9 72 42)" opacity="0.5">
              <rect x="22" y="14" width="94" height="54" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#94a3b8" strokeDasharray="4 4" />
              <line x1="30" y1="26" x2="60" y2="26" stroke={accentColor} strokeWidth="2.5" />
              <line x1="30" y1="34" x2="80" y2="34" stroke="#94a3b8" strokeWidth="1.8" />
            </g>

            {/* Glowing 3D Radio Wave Beacons */}
            <g className="portal-anim-ambient-waves" filter={`url(#${pfx}-glow)`}>
              <path d="M136 22 A 16 16 0 0 1 152 38" stroke="#38bdf8" strokeWidth="2.2" strokeOpacity="0.9" />
              <path d="M136 14 A 24 24 0 0 1 160 38" stroke="#06b6d4" strokeWidth="2.2" strokeOpacity="0.6" />
            </g>

            {/* Primary 3D Floating Smart Card Body */}
            <g className="portal-anim-card-body" filter={`url(#${pfx}-shadow)`}>
              <rect x="42" y="16" width="94" height="54" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="1.8" />
              <rect x="42" y="16" width="94" height="54" rx="10" stroke={accentColor} strokeWidth="2" />

              {/* Sweeping 5-Stop Holographic Security Foil Band */}
              <path
                d="M42 34 L88 16 H106 L42 41 Z"
                fill={`url(#${pfx}-holoFoil)`}
                stroke="none"
              />

              {/* Metallic Magnetic Stripe with Obsidian Gloss */}
              <path d="M42 27 H136" stroke={`url(#${pfx}-accentDark)`} strokeWidth="3.5" />

              {/* 24k Gold Metallic EMV Microchip */}
              <g className="portal-anim-chip">
                <rect x="54" y="36" width="16" height="13" rx="3" fill={`url(#${pfx}-goldFoil)`} stroke="#0369a1" strokeWidth="1.2" />
                <path d="M54 40.5 H70 M54 44.5 H70 M62 36 V49" stroke="#0284c7" strokeWidth="0.9" />
              </g>

              {/* NFC Contactless Wave Rings */}
              <g stroke="#0284c7">
                <path className="portal-anim-nfc-1" d="M120 37 A 6 6 0 0 1 120 47" strokeWidth="2.2" />
                <path className="portal-anim-nfc-2" d="M124 34 A 10 10 0 0 1 124 50" strokeWidth="2.2" />
              </g>

              {/* Embossed Cardholder Name & Identification Codes */}
              <line x1="54" y1="56" x2="90" y2="56" stroke={accentColor} strokeWidth="2.2" />
              <line x1="54" y1="62" x2="74" y2="62" stroke="#64748b" strokeWidth="1.6" />
            </g>

            {/* Floating 3D Download Capsule Orb with Glowing Ring */}
            <g className="portal-anim-download-group" filter={`url(#${pfx}-shadow)`}>
              <circle cx="132" cy="56" r="13" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2" />
              <circle cx="132" cy="56" r="13" stroke={`url(#${pfx}-goldFoil)`} strokeWidth="2" />
              <path
                className="portal-anim-download-arrow"
                d="M132 49 V61 M127 57 L132 62 L137 57"
                stroke="#0284c7"
                strokeWidth="2.8"
                filter={`url(#${pfx}-glow)`}
              />
            </g>
          </g>
        )}

        {/* =========================================================================
            3. SEARCH MEDICAL PROVIDER (3D Hospital Campus & Gemstone Geopin)
            ========================================================================= */}
        {iconType === 'medical' && (
          <g className="icon-group-medical">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="40" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* 3D Isometric Campus Ground Plaza Grid */}
            <g opacity="0.45">
              <path d="M14 66 L84 79 L154 66" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M30 56 L84 66 L138 56" stroke="#cbd5e1" strokeWidth="1.2" />
              <path d="M46 46 L84 53 L122 46" stroke="#cbd5e1" strokeWidth="1.2" />
            </g>

            {/* Pulsing Concentric Sonar Radar Waves on Ground */}
            <ellipse
              className="portal-anim-radar-wave"
              cx="84"
              cy="67"
              rx="28"
              ry="8"
              stroke="#38bdf8"
              strokeWidth="2"
              fill={`url(#${pfx}-accentGrad)`}
              fillOpacity="0.18"
              filter={`url(#${pfx}-glow)`}
            />

            {/* Secondary Satellite Clinic Nodes with Emerald Crosses */}
            <g className="portal-anim-network-nodes">
              <circle cx="36" cy="52" r="7" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <path d="M36 49 V55 M33 52 H39" stroke="#0284c7" strokeWidth="2" />

              <circle cx="132" cy="52" r="7" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <path d="M132 49 V55 M129 52 H135" stroke="#0284c7" strokeWidth="2" />
            </g>

            {/* 3D Modern Hospital Building Pavilion (Rounded Corners) */}
            <g filter={`url(#${pfx}-shadow)`}>
              <rect x="68" y="48" width="32" height="18" rx="6" fill={`url(#${pfx}-glassGrad)`} stroke={accentColor} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M84 48 C92 48 100 51 100 54 V66 H84 V48 Z" fill={`url(#${pfx}-accentDark)`} stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M80 66 V58 C80 55 88 55 88 58 V66" fill="#ffffff" stroke={accentColor} strokeWidth="1.8" strokeLinejoin="round" />
            </g>

            {/* Floating 3D Gemstone Geolocator Pin with Smooth Rounded Tip */}
            <g className="portal-anim-pin" filter={`url(#${pfx}-shadow)`}>
              <path
                d="M84 8 C68 8 58 19 58 33 C58 46 76 58 82 62.5 C83.2 63.5 84.8 63.5 86 62.5 C92 58 110 46 110 33 C110 19 100 8 84 8 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M84 8 C68 8 58 19 58 33 C58 46 76 58 82 62.5 C83.2 63.5 84.8 63.5 86 62.5 C92 58 110 46 110 33 C110 19 100 8 84 8 Z"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Specular Light Reflection Ridge */}
              <path d="M84 8 V62" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.85" strokeLinecap="round" />

              {/* Bold Illuminated Pill-Rounded Medical Facility Cross */}
              <g className="portal-anim-cross" filter={`url(#${pfx}-glow)`}>
                <rect x="80" y="21" width="8" height="22" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.8" />
                <rect x="73" y="28" width="22" height="8" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.8" />
                <path d="M84 22 V42 M74 32 H94" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
              </g>
            </g>
          </g>
        )}

        {/* =========================================================================
            4. CORPORATE / BROKER / INSURER PROFILE (3D Smart ID Medallion)
            ========================================================================= */}
        {iconType === 'profile' && (
          <g className="icon-group-profile">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="42" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Lanyard Ring & Gold Metallic Fastener */}
            <ellipse cx="84" cy="12" rx="8" ry="4" fill="none" stroke="#64748b" strokeWidth="2.2" />
            <rect x="81" y="14" width="6" height="5" rx="1.5" fill={`url(#${pfx}-goldFoil)`} stroke="#0369a1" strokeWidth="1" />

            {/* Holographic Org Hierarchy Network Links */}
            <g opacity="0.6">
              <path d="M22 42 H46 M122 42 H146" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
              <circle cx="22" cy="42" r="6" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <circle cx="146" cy="42" r="6" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
            </g>

            {/* Primary 3D Beveled Smart Identity Card */}
            <g className="portal-anim-avatar" filter={`url(#${pfx}-shadow)`}>
              <rect x="52" y="17" width="64" height="56" rx="12" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2" />
              <rect x="52" y="17" width="64" height="56" rx="12" stroke={accentColor} strokeWidth="2" />

              {/* Holographic Portrait Avatar with Halo */}
              <circle cx="84" cy="34" r="14" fill={`url(#${pfx}-accentGrad)`} fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="84" cy="34" r="9.5" fill={`url(#${pfx}-accentGrad)`} stroke="#ffffff" strokeWidth="1.8" />
              <path
                d="M68 62 C68 53 74 48 84 48 C94 48 100 53 100 62"
                fill={`url(#${pfx}-accentDark)`}
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Micro-telemetry Barcode & Status Track */}
              <line x1="58" y1="23" x2="74" y2="23" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="58" y1="27" x2="68" y2="27" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* 3D Cryptographic Verification Shield Medallion with Rounded Crown & Base */}
            <g className="portal-anim-shield" filter={`url(#${pfx}-shadow)`}>
              <path
                d="M98 44 C104 45.5 108 47.5 108 50 V57 C108 63 104 67 98 68.5 C92 67 88 63 88 57 V50 C88 47.5 92 45.5 98 44 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M98 44 C104 45.5 108 47.5 108 50 V57 C108 63 104 67 98 68.5 C92 67 88 63 88 57 V50 C88 47.5 92 45.5 98 44 Z"
                stroke={`url(#${pfx}-goldFoil)`}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                className="portal-anim-check"
                d="M93.5 56.5 L96.5 59.5 L102.5 53.5"
                stroke="#38bdf8"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${pfx}-glow)`}
              />
            </g>
          </g>
        )}

        {/* =========================================================================
            5. POLICY DETAILS & BENEFITS / COVERAGE (3D Covenant Codex & Shield)
            ========================================================================= */}
        {iconType === 'policy' && (
          <g className="icon-group-policy">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="43" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Stacked Fanned Contracts in Background (Rounded Corners) */}
            <rect x="30" y="15" width="64" height="56" rx="10" transform="rotate(-7 62 43)" fill={`url(#${pfx}-glassGrad)`} stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="74" y="15" width="64" height="56" rx="10" transform="rotate(7 106 43)" fill={`url(#${pfx}-glassGrad)`} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Floating Gold Guarantee Pill on Top-Right */}
            <g className="portal-anim-tier-tag" filter={`url(#${pfx}-shadow)`}>
              <rect x="118" y="10" width="42" height="20" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke={`url(#${pfx}-goldFoil)`} strokeWidth="1.8" />
              <path d="M126 20 L130 24 L138 16" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="142" y1="20" x2="152" y2="20" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Primary 3D Protected Covenant Codex Document */}
            <g className="portal-anim-doc" filter={`url(#${pfx}-shadow)`}>
              <rect x="52" y="14" width="64" height="58" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2" />
              <rect x="52" y="14" width="64" height="58" rx="10" stroke={accentColor} strokeWidth="2" />

              {/* Covenant Header Bar with Specular Shine */}
              <line x1="62" y1="24" x2="88" y2="24" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3.5" strokeLinecap="round" />
              <line className="portal-anim-line-1" x1="62" y1="33" x2="102" y2="33" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
              <line className="portal-anim-line-2" x1="62" y1="41" x2="108" y2="41" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
              <line className="portal-anim-line-3" x1="62" y1="49" x2="94" y2="49" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Volumetric 3D Rounded Shield of Guarantee */}
            <g className="portal-anim-guarantee-shield" filter={`url(#${pfx}-shadow)`}>
              <path
                d="M96 42 C102 43.5 108 45.5 108 48 V56.5 C108 63 102 67 96 68.5 C90 67 84 63 84 56.5 V48 C84 45.5 90 43.5 96 42 Z"
                fill={`url(#${pfx}-accentGrad)`}
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                className="portal-anim-check"
                d="M91.5 56 L94.5 59 L101.5 52"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${pfx}-glow)`}
              />
            </g>
          </g>
        )}

        {/* =========================================================================
            6. MEMBER DATA UPLOAD / ENROLLMENT (3D Datavault & Holographic Stream)
            ========================================================================= */}
        {iconType === 'upload' && (
          <g className="icon-group-upload">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="90" cy="40" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* 3D Datacenter Server Rack Chassis on Left */}
            <g filter={`url(#${pfx}-shadow)`}>
              <rect x="18" y="24" width="46" height="42" rx="6" fill={`url(#${pfx}-accentDark)`} stroke="#0f172a" strokeWidth="2" />
              <line x1="18" y1="36" x2="64" y2="36" stroke="#334155" />
              <line x1="18" y1="48" x2="64" y2="48" stroke="#334155" />
              {/* Dual-Color Status LEDs */}
              <circle cx="26" cy="30" r="2.2" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <circle cx="33" cy="30" r="2.2" fill="#38bdf8" />
              <circle cx="26" cy="42" r="2.2" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <circle cx="33" cy="42" r="2.2" fill="#38bdf8" />
              <circle cx="26" cy="54" r="2.2" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <circle cx="33" cy="54" r="2.2" fill="#38bdf8" />
            </g>

            {/* Target 3D Storage Vault on Right */}
            <g filter={`url(#${pfx}-shadow)`}>
              <rect x="122" y="26" width="32" height="38" rx="6" fill={`url(#${pfx}-glassGrad)`} stroke={accentColor} strokeWidth="2" />
              <path d="M130 36 L134 40 L142 32" stroke="#0284c7" strokeWidth="2.5" filter={`url(#${pfx}-glow)`} />
              <line x1="128" y1="47" x2="148" y2="47" stroke="#64748b" strokeWidth="2" />
              <line x1="128" y1="53" x2="142" y2="53" stroke="#cbd5e1" strokeWidth="1.8" />
            </g>

            {/* Holographic Upward Data Flow Light Ribbon */}
            <path
              d="M64 48 Q 78 30, 92 30 T 122 36"
              stroke="#38bdf8"
              strokeWidth="2.8"
              strokeDasharray="4 3"
              filter={`url(#${pfx}-glow)`}
            />

            {/* Floating 3D Data Cubes */}
            <rect className="portal-anim-packet-1" x="72" y="38" width="6.5" height="6.5" rx="1.8" fill="#ffffff" stroke={accentColor} strokeWidth="1.5" filter={`url(#${pfx}-glow)`} />
            <rect className="portal-anim-packet-2" x="84" y="32" width="6.5" height="6.5" rx="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" filter={`url(#${pfx}-glow)`} />

            {/* Central Cloud Platform with High-Power Launch Vector */}
            <g className="portal-anim-cloud" filter={`url(#${pfx}-shadow)`}>
              <path
                d="M74 54 C66 54 60 48 60 41 C60 36 64 31 70 31 C72 21 81 15 92 15 C103 15 111 21 113 31 C119 31 124 36 124 41 C124 48 118 54 110 54"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#ffffff"
                strokeWidth="2.2"
              />
              <path
                d="M74 54 C66 54 60 48 60 41 C60 36 64 31 70 31 C72 21 81 15 92 15 C103 15 111 21 113 31 C119 31 124 36 124 41 C124 48 118 54 110 54"
                stroke={accentColor}
                strokeWidth="2"
              />
              <g className="portal-anim-upload-arrow">
                <line x1="92" y1="58" x2="92" y2="28" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3.5" filter={`url(#${pfx}-glow)`} />
                <path d="M84 36 L92 28 L100 36" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3.5" filter={`url(#${pfx}-glow)`} />
              </g>
            </g>
          </g>
        )}

        {/* =========================================================================
            7. TRACK CLAIMS / VIEW CLAIMS (3D Ledger Console & Optical Loupe)
            ========================================================================= */}
        {iconType === 'claims' && (
          <g className="icon-group-claims">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="86" cy="42" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Stacked Case Files in Background */}
            <rect x="36" y="16" width="64" height="54" rx="8" transform="rotate(-6 68 43)" fill={`url(#${pfx}-glassGrad)`} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Floating Live Audit Tag on Top-Right */}
            <g className="portal-anim-status-pill" filter={`url(#${pfx}-shadow)`}>
              <rect x="114" y="12" width="44" height="20" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <circle cx="123" cy="22" r="3.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <line x1="129" y1="22" x2="150" y2="22" stroke="#0284c7" strokeWidth="2.2" />
            </g>

            {/* Primary 3D Floating Ledger Board */}
            <g className="portal-anim-clipboard" filter={`url(#${pfx}-shadow)`}>
              <rect x="50" y="14" width="66" height="58" rx="8" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2" />
              <rect x="50" y="14" width="66" height="58" rx="8" stroke={accentColor} strokeWidth="2" />

              {/* Brushed Metallic Chrome Clip */}
              <path d="M72 14 V9 C72 7 74 6 76 6 H90 C92 6 94 7 94 9 V14" fill="#f1f5f9" stroke="#475569" strokeWidth="1.8" />

              {/* Glowing Status Milestone Pipeline */}
              <g className="portal-anim-timeline">
                <line x1="64" y1="25" x2="64" y2="57" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3" />
                <circle cx="64" cy="25" r="4.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
                <circle cx="64" cy="41" r="4.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
                <circle className="portal-anim-active-node" cx="64" cy="57" r="5.5" fill="#ffffff" stroke={accentColor} strokeWidth="3.5" filter={`url(#${pfx}-glow)`} />

                <line x1="74" y1="25" x2="102" y2="25" stroke="#64748b" strokeWidth="2.2" />
                <line x1="74" y1="41" x2="98" y2="41" stroke="#64748b" strokeWidth="2.2" />
                <line x1="74" y1="57" x2="92" y2="57" stroke={accentColor} strokeWidth="2.8" />
              </g>
            </g>

            {/* 3D Precision Optical Loupe (Magnifying Glass) */}
            <g className="portal-anim-glass" filter={`url(#${pfx}-shadow)`}>
              <circle cx="114" cy="49" r="12" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2.8" />
              <circle cx="114" cy="49" r="12" stroke={`url(#${pfx}-goldFoil)`} strokeWidth="2.2" />
              <line x1="123" y1="58" x2="134" y2="69" stroke={`url(#${pfx}-accentDark)`} strokeWidth="4" strokeLinecap="round" />
              <path d="M109 49 H119 M114 44 V54" stroke="#0284c7" strokeWidth="2" />
            </g>
          </g>
        )}

        {/* =========================================================================
            8. MEMBER DASHBOARD (3D Holographic Avatar Pedestals)
            ========================================================================= */}
        {iconType === 'members' && (
          <g className="icon-group-members">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="42" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* 3D Fiber-Optic Corporate Hierarchy Bus */}
            <path d="M34 52 C48 36, 68 36, 84 36 C100 36, 120 36, 134 52" stroke="#38bdf8" strokeWidth="2.8" strokeDasharray="4 3" filter={`url(#${pfx}-glow)`} />

            {/* Stepped Pedestal Member on Left */}
            <g className="portal-anim-member-left" filter={`url(#${pfx}-shadow)`}>
              <rect x="18" y="30" width="36" height="42" rx="8" fill={`url(#${pfx}-glassGrad)`} stroke="#94a3b8" strokeWidth="2" />
              <circle cx="36" cy="43" r="7.5" fill={`url(#${pfx}-accentGrad)`} fillOpacity="0.4" stroke="#64748b" />
              <path d="M24 63 C24 56 29 53 36 53 C43 53 48 56 48 63" fill={`url(#${pfx}-accentDark)`} stroke="#64748b" />
            </g>

            {/* Stepped Pedestal Member on Right */}
            <g className="portal-anim-member-right" filter={`url(#${pfx}-shadow)`}>
              <rect x="114" y="30" width="36" height="42" rx="8" fill={`url(#${pfx}-glassGrad)`} stroke="#94a3b8" strokeWidth="2" />
              <circle cx="132" cy="43" r="7.5" fill={`url(#${pfx}-accentGrad)`} fillOpacity="0.4" stroke="#64748b" />
              <path d="M120 63 C120 56 125 53 132 53 C139 53 144 56 144 63" fill={`url(#${pfx}-accentDark)`} stroke="#64748b" />
            </g>

            {/* Floating Headcount Chip */}
            <g className="portal-anim-count-chip" filter={`url(#${pfx}-shadow)`}>
              <rect x="66" y="8" width="36" height="18" rx="9" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <circle cx="74" cy="17" r="3.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <line x1="81" y1="17" x2="94" y2="17" stroke="#0284c7" strokeWidth="2.2" />
            </g>

            {/* Central Elevated Executive Leader Pedestal */}
            <g className="portal-anim-member-center" filter={`url(#${pfx}-shadow)`}>
              <rect x="60" y="16" width="48" height="56" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2.2" />
              <rect x="60" y="16" width="48" height="56" rx="10" stroke={accentColor} strokeWidth="2.2" />

              <circle cx="84" cy="33" r="10" fill={`url(#${pfx}-accentGrad)`} stroke="#ffffff" strokeWidth="2.2" filter={`url(#${pfx}-glow)`} />
              <path d="M70 60 C70 51 76 47 84 47 C92 47 98 51 98 60" fill={`url(#${pfx}-accentDark)`} stroke="#ffffff" strokeWidth="2" />
              <circle cx="84" cy="65" r="3.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
            </g>
          </g>
        )}

        {/* =========================================================================
            9. BROKER CLAIM SUBMISSION (3D Claim Dossier & Supersonic Origami Glider)
            ========================================================================= */}
        {iconType === 'claimsubmission' && (
          <g className="icon-group-submission">
            {/* Luminous Colored Ambient Aura Circle (Clean Harmonic Ring) */}
            <circle cx="92" cy="42" r="30" fill={`url(#${pfx}-ambientAura)`} stroke={accentColor} strokeWidth="1.8" strokeOpacity="0.75" />

            {/* Glowing Submission Launch Arc */}
            <path
              d="M44 60 C 64 60, 88 52, 134 24"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              filter={`url(#${pfx}-glow)`}
            />

            {/* Floating Origin Claim Dossier on Left */}
            <g className="portal-anim-ticket" filter={`url(#${pfx}-shadow)`}>
              {/* Main Document Body */}
              <rect x="22" y="16" width="56" height="54" rx="12" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2" />
              <rect x="22" y="16" width="56" height="54" rx="12" stroke={accentColor} strokeWidth="1.8" />

              {/* Metallic Fastener Clip */}
              <rect x="40" y="11" width="20" height="8" rx="4" fill="#ffffff" stroke={accentColor} strokeWidth="1.6" />

              {/* Itemized Claim Data Lines */}
              <line x1="32" y1="28" x2="62" y2="28" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3" strokeLinecap="round" />
              <line x1="32" y1="37" x2="68" y2="37" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="32" y1="46" x2="58" y2="46" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="32" y1="55" x2="52" y2="55" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />

              {/* Claim Verified Seal Tag */}
              <circle cx="64" cy="56" r="8" fill={`url(#${pfx}-glassGrad)`} stroke="#38bdf8" strokeWidth="1.8" />
              <path d="M60.5 56 L63 58.5 L68 53.5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Destination Settlement Waypoint Tag on Upper Right */}
            <g className="portal-anim-status-pill" filter={`url(#${pfx}-shadow)`}>
              <rect x="118" y="8" width="44" height="20" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <circle cx="127" cy="18" r="3.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <path d="M135 18 L139 22 L147 14" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Primary 3D Origami Supersonic Glider (with Gently Rounded Micro-Fillet Corners) */}
            <g className="portal-anim-airplane" filter={`url(#${pfx}-shadow)`}>
              {/* Lower Keel (Volumetric 3D Shadow Facet with Rounded Tip) */}
              <path
                d="M102 46 L110 58 Q 112 60.5, 114 58 L 136 24 L 102 46 Z"
                fill={`url(#${pfx}-accentDark)`}
                stroke={accentColor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Right Wing Facet (Accent Blue Shading with Rounded Wingtip) */}
              <path
                d="M135 23 L 102 46 L 126 37 Q 129 36, 127 34 L 137 23 Q 138 22, 135 23 Z"
                fill={`url(#${pfx}-accentGrad)`}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Left Main Wing Facet (Specular Frosted Glass Surface with Rounded Wingtip & Nose) */}
              <path
                d="M134 21 L 76 37 Q 73 38, 76 40 L 100 46 Q 102 46, 103 45 L 135 23 Q 138 22, 134 21 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M134 21 L 76 37 Q 73 38, 76 40 L 100 46 Q 102 46, 103 45 L 135 23 Q 138 22, 134 21 Z"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Specular Fold Spine with Rounded End Caps */}
              <line x1="135" y1="23" x2="102" y2="46" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />

              {/* Glowing Afterburner Thruster */}
              <circle cx="102" cy="46" r="4.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <circle cx="102" cy="46" r="2.2" fill="#ffffff" />
              <line x1="102" y1="46" x2="88" y2="54" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="3 3" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* =========================================================================
            10. CLIENT DETAILS / CORPORATE ACCOUNTS (Modern Rounded Glass Towers)
            ========================================================================= */}
        {iconType === 'clientdetails' && (
          <g className="icon-group-clientdetails">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="40" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Smooth Rounded Plaza Pedestal Baseline */}
            <rect x="12" y="70" width="144" height="6" rx="3" fill={`url(#${pfx}-glassGrad)`} stroke="#64748b" strokeWidth="1.8" />

            {/* Left Annex Corporate Tower (Smooth Continuous Dome Crown & Rounded Base) */}
            <g filter={`url(#${pfx}-shadow)`}>
              <path
                d="M22 66 V32 C22 23, 29 21, 36 21 V70 H26 C23.8 70, 22 68.2, 22 66 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M36 21 C43 21, 50 23, 50 32 V66 C50 68.2, 48.2 70, 46 70 H36 V21 Z"
                fill={`url(#${pfx}-accentDark)`}
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>

            {/* Right Annex Corporate Tower (Smooth Continuous Dome Crown & Rounded Base) */}
            <g filter={`url(#${pfx}-shadow)`}>
              <path
                d="M118 66 V32 C118 23, 125 21, 132 21 V70 H122 C119.8 70, 118 68.2, 118 66 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M132 21 C139 21, 146 23, 146 32 V66 C146 68.2, 144.2 70, 142 70 H132 V21 Z"
                fill={`url(#${pfx}-accentDark)`}
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>

            {/* Inter-Tower Fiber Optic Laser Links with Rounded End Caps */}
            <line x1="50" y1="48" x2="66" y2="48" stroke="#06b6d4" strokeWidth="2.2" strokeDasharray="3 3" strokeLinecap="round" filter={`url(#${pfx}-glow)`} />
            <line x1="102" y1="48" x2="118" y2="48" stroke="#06b6d4" strokeWidth="2.2" strokeDasharray="3 3" strokeLinecap="round" filter={`url(#${pfx}-glow)`} />

            {/* Central Primary Skyscraper Tower with Continuous Smooth Arch Dome (Zero Pointy Apex) */}
            <g className="portal-anim-tower" filter={`url(#${pfx}-shadow)`}>
              {/* Left Light-Reflecting Facet with Smooth Rounded Top & Rounded Base */}
              <path
                d="M66 66 V24 C66 12, 75 10, 84 10 V70 H70 C67.8 70, 66 68.2, 66 66 Z"
                fill={`url(#${pfx}-glassGrad)`}
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M66 66 V24 C66 12, 75 10, 84 10 V70 H70 C67.8 70, 66 68.2, 66 66 Z"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Right Shadow Facet with Smooth Rounded Top & Rounded Base */}
              <path
                d="M84 10 C93 10, 102 12, 102 24 V66 C102 68.2, 100.2 70, 98 70 H84 V10 Z"
                fill={`url(#${pfx}-accentDark)`}
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Rooftop Antenna Spire & Rounded Broadcasting Beacon */}
              <line x1="84" y1="3" x2="84" y2="10" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
              <circle className="portal-anim-beacon" cx="84" cy="3" r="4.5" fill="#38bdf8" filter={`url(#${pfx}-glow)`} />
              <circle cx="84" cy="3" r="2" fill="#ffffff" />

              {/* Illuminated Floor Slabs & Generously Rounded Pill Window Matrix */}
              <g className="portal-anim-windows" fill="#bae6fd">
                <rect x="71" y="20" width="8" height="5.5" rx="2.75" filter={`url(#${pfx}-glow)`} />
                <rect x="89" y="20" width="8" height="5.5" rx="2.75" />

                <rect x="71" y="32" width="8" height="5.5" rx="2.75" filter={`url(#${pfx}-glow)`} />
                <rect x="89" y="32" width="8" height="5.5" rx="2.75" />

                <rect x="71" y="44" width="8" height="5.5" rx="2.75" filter={`url(#${pfx}-glow)`} />
                <rect x="89" y="44" width="8" height="5.5" rx="2.75" />

                <rect x="71" y="56" width="8" height="5.5" rx="2.75" filter={`url(#${pfx}-glow)`} />
                <rect x="89" y="56" width="8" height="5.5" rx="2.75" />
              </g>

              {/* Grand Entrance Atrium with Smooth Rounded Archway */}
              <path d="M78 70 V60 C78 55, 90 55, 90 60 V70 Z" fill={`url(#${pfx}-accentGrad)`} stroke="#ffffff" strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          </g>
        )}

        {/* =========================================================================
            11. POLICY LIST & ENDORSEMENTS (3D Fanned Ledger & 24k Gold Rosette)
            ========================================================================= */}
        {iconType === 'policylist' && (
          <g className="icon-group-policylist">
            {/* Luminous Colored Ambient Aura */}
            <ellipse cx="84" cy="42" rx="46" ry="24" fill={`url(#${pfx}-ambientAura)`} />

            {/* Background 3D Stacked Policy Dockets (Rounded Corners) */}
            <rect x="28" y="14" width="62" height="56" rx="10" transform="rotate(-8 59 42)" fill={`url(#${pfx}-glassGrad)`} stroke="#cbd5e1" strokeWidth="1.8" />
            <rect x="78" y="14" width="62" height="56" rx="10" transform="rotate(8 109 42)" fill={`url(#${pfx}-glassGrad)`} stroke="#cbd5e1" strokeWidth="1.8" />

            {/* Floating Live Policy Tag */}
            <g className="portal-anim-counter-tag" filter={`url(#${pfx}-shadow)`}>
              <rect x="116" y="10" width="42" height="20" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#0284c7" strokeWidth="1.8" />
              <path d="M124 20 L128 24 L136 16" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${pfx}-glow)`} />
              <line x1="140" y1="20" x2="150" y2="20" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Primary 3D Endorsed Policy Certificate */}
            <g className="portal-anim-policy-front" filter={`url(#${pfx}-shadow)`}>
              <rect x="50" y="14" width="68" height="58" rx="10" fill={`url(#${pfx}-glassGrad)`} stroke="#ffffff" strokeWidth="2.2" />
              <rect x="50" y="14" width="68" height="58" rx="10" stroke={accentColor} strokeWidth="2.2" />

              {/* Top Security Banner */}
              <line x1="60" y1="24" x2="94" y2="24" stroke={`url(#${pfx}-accentGrad)`} strokeWidth="3.5" strokeLinecap="round" />

              {/* Itemized Endorsement Clauses with Emerald Checks */}
              <path d="M60 33 L64 37 L70 30" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="75" y1="33" x2="108" y2="33" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />

              <path d="M60 42 L64 46 L70 39" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="75" y1="42" x2="104" y2="42" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />

              <path d="M60 51 L64 55 L70 48" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="75" y1="51" x2="98" y2="51" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Volumetric 3D 24k Gold Metallic Wax Rosette Seal with Rounded Ribbons */}
            <g className="portal-anim-rosette" filter={`url(#${pfx}-shadow)`}>
              <circle cx="108" cy="54" r="12" fill={`url(#${pfx}-goldFoil)`} stroke="#0369a1" strokeWidth="2.2" />
              <path d="M103 64 L100 72 C100 74.5 103 75.5 105 73.5 L108 71 L111 73.5 C113 75.5 116 74.5 116 72 L113 64" fill={`url(#${pfx}-goldFoil)`} stroke="#0369a1" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="108" cy="54" r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
              <path d="M108 50 L110 58 M104 54 H112" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

