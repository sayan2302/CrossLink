'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PortalConfig } from '@/config/tenants';
import { FormField, CustomInput } from '@/tenants/Common/ui';
import 'leaflet/dist/leaflet.css';

interface UserSession {
  username: string;
  role: string;
}

interface SearchMedicalProviderViewProps {
  portal: PortalConfig;
  user: UserSession;
  componentId: string;
  onBack: () => void;
}

export interface MedicalProviderItem {
  id: number;
  typeOfService: string;
  networkPartner: string;
  name: string;
  address: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export interface GeocodeResult {
  placeId: string | number;
  displayName: string;
  name?: string;
  lat: number;
  lon: number;
  type?: string;
}

// Default initial location: Bangkok Central (13.7563, 100.5018)
const DEFAULT_CENTER = {
  name: 'Bangkok, Thailand',
  lat: 13.7563,
  lon: 100.5018,
};

const RADIUS_OPTIONS = [5, 10, 20, 50, 100, 500, 1000];
export type MapStyle = 'streets' | 'satellite';

function applyBaseMapTiles(L: any, tileGroup: any, style: MapStyle) {
  if (!tileGroup) return;
  tileGroup.clearLayers();
  if (style === 'satellite') {
    // ESRI World Imagery Base + Labels Reference
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(tileGroup);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(tileGroup);
  } else {
    // Standard Streets (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(tileGroup);
  }
}

export default function SearchMedicalProviderView({
  portal,
  onBack,
}: SearchMedicalProviderViewProps) {
  // Location & Filter States
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_CENTER);
  const [locationInput, setLocationInput] = useState(DEFAULT_CENTER.name);
  const [radius, setRadius] = useState<number>(5);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Providers & UI States
  const [providers, setProviders] = useState<MedicalProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Map DOM & Leaflet Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayersGroupRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);
  const circleOverlayRef = useRef<any>(null);
  const providerCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // ── 1. Fetch Providers via CrossLink BFF ─────────────────────────────────────
  const fetchProviders = useCallback(
    async (lat: number, lon: number, rad: number) => {
      // Abort any preceding in-flight fetch to prevent race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentReqId = ++activeRequestIdRef.current;
      setLoadingProviders(true);
      setErrorMessage('');
      try {
        const res = await fetch('/api/provider/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            long: lon,
            radius: rad,
          }),
          signal: controller.signal,
        });

        // Drop response if a newer search request was initiated
        if (currentReqId !== activeRequestIdRef.current) {
          return;
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          setErrorMessage(errJson?.message || 'Unable to load network medical providers.');
          setProviders([]);
          return;
        }

        const data = await res.json();
        if (currentReqId !== activeRequestIdRef.current) {
          return;
        }

        if (data.isSuccess && Array.isArray(data.providers)) {
          // Strictly clamp results to requested radius
          const strictlyWithinRadius = data.providers.filter(
            (p: MedicalProviderItem) => p.distanceKm === undefined || p.distanceKm <= rad
          );
          setProviders(strictlyWithinRadius);
          if (strictlyWithinRadius.length === 0) {
            setErrorMessage(`No medical providers found within ${rad} Km. Try increasing the search radius.`);
          }
        } else {
          setProviders([]);
          setErrorMessage(data.message || 'No medical providers found for this location.');
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return; // Intentionally aborted due to user radius/location change
        }
        if (currentReqId === activeRequestIdRef.current) {
          console.error('Error fetching providers:', err);
          setErrorMessage('Network error while retrieving medical providers.');
        }
      } finally {
        if (currentReqId === activeRequestIdRef.current) {
          setLoadingProviders(false);
        }
      }
    },
    []
  );

  // Initial load & whenever coordinates or radius change
  useEffect(() => {
    fetchProviders(selectedLocation.lat, selectedLocation.lon, radius);
  }, [selectedLocation.lat, selectedLocation.lon, radius, fetchProviders]);

  // ── 2. Autocomplete Geocode Lookups ──────────────────────────────────────────
  const handleLocationInputChange = (val: string) => {
    setLocationInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingLocation(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/provider/geocode?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    const loc = {
      name: item.name || item.displayName.split(',')[0],
      lat: item.lat,
      lon: item.lon,
    };
    setSelectedLocation(loc);
    setLocationInput(loc.name);
    setShowSuggestions(false);
    setSelectedProviderId(null);
  };

  // ── 3. GPS Geolocation Trigger ───────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          name: 'My Current Location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setSelectedLocation(loc);
        setLocationInput(loc.name);
        setShowSuggestions(false);
        setSelectedProviderId(null);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        alert('Could not detect your current location. Please check your browser location permissions.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── 4. Initialize Interactive Leaflet Map ────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (isCancelled) return;

      // Ensure map container does not already have a map
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [selectedLocation.lat, selectedLocation.lon],
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        // Add sleek zoom control in top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Dynamic Basemap Tile Group (Streets, Satellite, Terrain, Transit)
        const tileGroup = L.layerGroup().addTo(map);
        tileLayersGroupRef.current = tileGroup;
        applyBaseMapTiles(L, tileGroup, mapStyle);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (circleOverlayRef.current) {
        circleOverlayRef.current = null;
      }
      if (tileLayersGroupRef.current) {
        tileLayersGroupRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── 4b. Dynamic Basemap Style Switcher ───────────────────────────────────────
  useEffect(() => {
    if (tileLayersGroupRef.current) {
      import('leaflet').then((leafletModule) => {
        applyBaseMapTiles(leafletModule.default, tileLayersGroupRef.current, mapStyle);
      });
    }
  }, [mapStyle]);

  // ── 5. Sync Map Markers when Providers or Location Change ────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      if (!map || !markersLayer) return;

      markersLayer.clearLayers();

      // 1. Center Pulse Marker (User Search Location)
      const centerPulseIcon = L.divIcon({
        className: 'provider-center-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(2, 132, 199, 0.25); animation: pulse 2s infinite ease-out;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background-color: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current);
      }
      const centerMarker = L.marker([selectedLocation.lat, selectedLocation.lon], {
        icon: centerPulseIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      centerMarker.bindPopup(`<strong>${selectedLocation.name}</strong><br/><span style="font-size:11px;color:#64748b;">Search Center</span>`);
      centerMarkerRef.current = centerMarker;

      // 1b. Circular Radius Overlay (Brand-accented, semi-transparent, non-blocking)
      if (circleOverlayRef.current) {
        map.removeLayer(circleOverlayRef.current);
        circleOverlayRef.current = null;
      }
      const circleRadiusMeters = radius * 1000;
      const radiusCircle = L.circle([selectedLocation.lat, selectedLocation.lon], {
        radius: circleRadiusMeters,
        color: portal.accentColor || '#002D62',
        weight: 1.8,
        opacity: 0.75,
        fillColor: portal.accentColor || '#002D62',
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(map);
      circleOverlayRef.current = radiusCircle;

      // Filter providers based on current client filters and active radius
      const displayed = providers.filter((p) => {
        const matchesRadius = p.distanceKm === undefined || p.distanceKm <= radius;
        const matchesName =
          !nameFilter.trim() ||
          p.name.toLowerCase().includes(nameFilter.toLowerCase().trim()) ||
          p.formattedAddress.toLowerCase().includes(nameFilter.toLowerCase().trim());
        return matchesRadius && matchesName;
      });

      const bounds: [number, number][] = [[selectedLocation.lat, selectedLocation.lon]];

      // 2. Add Provider Pin Markers
      displayed.forEach((p) => {
        if (!p.latitude || !p.longitude) return;
        bounds.push([p.latitude, p.longitude]);

        const isSelected = selectedProviderId === p.id;
        const isClinic = p.typeOfService.toLowerCase().includes('clinic');
        const primaryColor = isSelected ? (portal.accentColor || '#002D62') : isClinic ? '#0d9488' : '#0284c7';

        const customPin = L.divIcon({
          className: `provider-pin-${p.id}`,
          html: `
            <div style="
              width: ${isSelected ? '38px' : '30px'};
              height: ${isSelected ? '38px' : '30px'};
              background: ${primaryColor};
              border: 2.5px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 3px 8px rgba(15, 23, 42, 0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <span style="
                transform: rotate(45deg);
                color: #ffffff;
                font-size: ${isSelected ? '16px' : '12px'};
                font-weight: 800;
                line-height: 1;
              ">+</span>
            </div>
          `,
          iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
          iconAnchor: [isSelected ? 19 : 15, isSelected ? 38 : 30],
        });

        const marker = L.marker([p.latitude, p.longitude], { icon: customPin }).addTo(markersLayer);

        // Marker Click -> Select and Scroll Card into View
        marker.on('click', () => {
          setSelectedProviderId(p.id);
          const cardEl = providerCardRefs.current[p.id];
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });

        // Popup Content
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 200px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.name}</div>
            <div style="font-size: 11px; color: ${primaryColor}; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
              ${p.typeOfService} &bull; ${p.distanceKm ? `${p.distanceKm} km away` : ''}
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 10px;">${p.formattedAddress || p.address}</div>
            <div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              <a 
                href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.latitude},${p.longitude}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #334155; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; text-decoration: none;"
              >
                <span>360° Street View</span>
              </a>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: ${primaryColor}; padding: 4px 8px; border-radius: 6px; text-decoration: none;"
              >
                <span>Directions &rarr;</span>
              </a>
            </div>
          </div>
        `);

        if (isSelected) {
          marker.openPopup();
        }
      });

      // Fit map view to cover circular radius bounds smoothly when no individual pin is selected
      if (!selectedProviderId) {
        map.fitBounds(radiusCircle.getBounds(), { padding: [28, 28] });
      }
    });
  }, [providers, selectedLocation, radius, nameFilter, selectedProviderId, portal.accentColor]);

  // Focus a specific provider from card list
  const handleFocusProvider = (p: MedicalProviderItem) => {
    setSelectedProviderId(p.id);
    if (mapInstanceRef.current && p.latitude && p.longitude) {
      mapInstanceRef.current.flyTo([p.latitude, p.longitude], 15, { duration: 0.8 });
    }
  };

  // Filtered providers for list render (strictly clamped to active radius)
  const filteredProviders = providers.filter((p) => {
    const matchesRadius = p.distanceKm === undefined || p.distanceKm <= radius;
    const matchesName =
      !nameFilter.trim() ||
      p.name.toLowerCase().includes(nameFilter.toLowerCase().trim()) ||
      p.formattedAddress.toLowerCase().includes(nameFilter.toLowerCase().trim());
    return matchesRadius && matchesName;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px 48px 24px' }}>
      {/* ── BREADCRUMB NAVIGATION ─────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            listStyle: 'none',
            padding: '12px 18px',
            fontSize: '13.5px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            margin: 0,
          }}
        >
          <li>
            <button
              type="button"
              onClick={onBack}
              style={{
                color: portal.accentColor,
                fontWeight: 650,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '13.5px',
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>Search Medical Provider</li>
        </ol>
      </nav>

      {/* ── CSS KEYFRAMES & LEAFLET TILE FIXES ────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 16px;
          background-color: #f8fafc !important;
          font-family: inherit;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
          border: 1px solid #e2e8f0;
          padding: 4px;
        }
        .provider-split-container {
          display: grid;
          grid-template-columns: 4fr 6fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .provider-split-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── TOP CONTROL & FILTER CARD ─────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Search Medical Provider
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Discover in-network hospitals, medical centers, and specialized clinics near your location.
            </p>
          </div>

          {/* Quick Radius Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Radius:
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                padding: '3px',
                border: '1px solid #e2e8f0',
                gap: '2px',
              }}
            >
              {RADIUS_OPTIONS.map((r) => {
                const active = radius === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (radius !== r) {
                        setSelectedProviderId(null);
                        setRadius(r);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9px',
                      fontSize: '12px',
                      fontWeight: active ? 750 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: 'none',
                      backgroundColor: active ? portal.accentColor : 'transparent',
                      color: active ? '#ffffff' : '#64748b',
                      boxShadow: active
                        ? `0 2px 8px ${portal.accentColor}35, 0 1px 2px rgba(0,0,0,0.08)`
                        : 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.color = '#0f172a';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {r} Km
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search Inputs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
          {/* Location Autocomplete Input */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Search by City, Province or Address
            </label>
            <CustomInput
              value={locationInput}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="e.g. Bangkok, Sukhumvit, Silom, Phuket..."
              accentColor={portal.accentColor}
              clearable={!isSearchingLocation}
              onClear={() => {
                setLocationInput('');
                setSuggestions([]);
              }}
              leadingIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              trailingIcon={
                isSearchingLocation ? (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #cbd5e1', borderTopColor: portal.accentColor, animation: 'pulse 0.8s linear infinite' }} />
                ) : undefined
              }
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  zIndex: 2000,
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {suggestions.map((item, idx) => (
                  <div
                    key={`${item.placeId}-${idx}`}
                    onClick={() => handleSelectSuggestion(item)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                      fontSize: '12.5px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.displayName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Name Filter */}
          <FormField label="Filter by Facility Name">
            <CustomInput
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search facility name..."
              clearable
              onClear={() => setNameFilter('')}
              accentColor={portal.accentColor}
              leadingIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </FormField>

          {/* Use Current GPS Location Button */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: '#334155', marginBottom: '6px' }}>
              Quick GPS Detection
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={detectingGps}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: `1.5px solid ${portal.accentColor}35`,
                backgroundColor: `${portal.accentColor}08`,
                color: portal.accentColor,
                fontSize: '13px',
                fontWeight: 700,
                cursor: detectingGps ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${portal.accentColor}15`;
                e.currentTarget.style.borderColor = portal.accentColor;
                e.currentTarget.style.boxShadow = `0 4px 12px ${portal.accentColor}25`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${portal.accentColor}08`;
                e.currentTarget.style.borderColor = `${portal.accentColor}35`;
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
              <span>{detectingGps ? 'Detecting Coordinates...' : 'Use My Current Location'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 40/60 SPLIT RESULTS: PROVIDER CARDS & INTERACTIVE MAP ─────────── */}
      <div className="provider-split-container">
        {/* Left Column: Scrollable Provider Cards */}
        <div>
          {/* Results Summary Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Providers Found
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '1px solid #e2e8f0',
                }}
              >
                {filteredProviders.length}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Within <strong>{radius} Km</strong> of {selectedLocation.name}
            </span>
          </div>

          {/* Skeletons while Loading */}
          {loadingProviders ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '18px',
                  }}
                >
                  <div className="crosslink-skeleton" style={{ width: '60%', height: '18px', borderRadius: '4px', marginBottom: '8px' }} />
                  <div className="crosslink-skeleton" style={{ width: '90%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="crosslink-skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
                    <div className="crosslink-skeleton" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : errorMessage && filteredProviders.length === 0 ? (
            /* Error / Empty State Card */
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '16px',
                padding: '36px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>
                No Medical Providers Found
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                {errorMessage}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fetchProviders(selectedLocation.lat, selectedLocation.lon, radius)}
                  disabled={loadingProviders}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 650,
                    border: 'none',
                    cursor: loadingProviders ? 'not-allowed' : 'pointer',
                    opacity: loadingProviders ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  {loadingProviders ? 'Searching...' : 'Retry Search'}
                </button>
                <button
                  type="button"
                  onClick={() => setRadius(50)}
                  disabled={loadingProviders}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: portal.accentColor,
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 650,
                    border: 'none',
                    cursor: loadingProviders ? 'not-allowed' : 'pointer',
                    opacity: loadingProviders ? 0.7 : 1,
                  }}
                >
                  Expand Radius to 50 Km
                </button>
              </div>
            </div>
          ) : (
            /* Provider Cards Scrollable List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredProviders.map((p) => {
                const isSelected = selectedProviderId === p.id;
                const isClinic = p.typeOfService.toLowerCase().includes('clinic');

                return (
                  <div
                    key={p.id}
                    ref={(el) => {
                      providerCardRefs.current[p.id] = el;
                    }}
                    onClick={() => handleFocusProvider(p)}
                    style={{
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      borderRadius: '14px',
                      border: isSelected ? `1.5px solid ${portal.accentColor}` : '1px solid #e2e8f0',
                      boxShadow: isSelected
                        ? `0 4px 12px ${portal.accentColor}18`
                        : '0 1px 3px rgba(15, 23, 42, 0.04)',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      borderLeft: isSelected
                        ? `4px solid ${portal.accentColor}`
                        : '1px solid #e2e8f0',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#e0f2fe';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {/* Top Row: Name and Type Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isClinic ? '#ccfbf1' : '#e0f2fe',
                            color: isClinic ? '#0f766e' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="3" width="16" height="18" rx="2" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                            <path d="M10 9h4" />
                            <path d="M12 7v4" />
                          </svg>
                        </div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                          {p.name}
                        </h4>
                      </div>

                      {/* Distance Pill */}
                      {p.distanceKm !== undefined && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.distanceKm} km
                        </span>
                      )}
                    </div>

                    {/* Address Text */}
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {p.formattedAddress || p.address}
                    </p>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: isClinic ? '#f0fdfa' : '#f0f9ff',
                          color: isClinic ? '#0d9488' : '#0284c7',
                          border: isClinic ? '1px solid #99f6e4' : '1px solid #bae6fd',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.typeOfService}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open 360° Google Street View"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 650,
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(15, 23, 42, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                            <path d="M2 12h20" />
                          </svg>
                          <span>Street View</span>
                        </a>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: portal.accentColor,
                            color: '#ffffff',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${portal.accentColor}40`;
                            e.currentTarget.style.filter = 'brightness(1.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          <span>Directions</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Map View */}
        <div
          style={{
            position: 'sticky',
            top: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            height: '760px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Map Top Bar */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 650, color: '#334155' }}>
                Interactive Provider Map
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: `${portal.accentColor}12`,
                  color: portal.accentColor,
                  border: `1px solid ${portal.accentColor}30`,
                }}
              >
                {radius} Km Radius
              </span>
            </div>
          </div>

          {/* Leaflet Map Target DOM Element */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Floating Satellite Map Toggle Button */}
            <button
              type="button"
              onClick={() => setMapStyle((prev) => (prev === 'satellite' ? 'streets' : 'satellite'))}
              onMouseDown={(e) => e.stopPropagation()}
              title={mapStyle === 'satellite' ? 'Switch back to Streets view' : 'Switch to Satellite imagery'}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                zIndex: 1000,
                backgroundColor: mapStyle === 'satellite' ? (portal.accentColor || '#002D62') : '#ffffff',
                color: mapStyle === 'satellite' ? '#ffffff' : '#334155',
                border: mapStyle === 'satellite' ? `1px solid ${portal.accentColor || '#002D62'}` : '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 650,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (mapStyle !== 'satellite') {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }
              }}
              onMouseLeave={(e) => {
                if (mapStyle !== 'satellite') {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Satellite</span>
              {mapStyle === 'satellite' && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginLeft: '2px',
                    letterSpacing: '0.02em',
                  }}
                >
                  ON
                </span>
              )}
            </button>

            {/* Floating Quick Compass / Reset Map Bounds Button */}
            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  if (circleOverlayRef.current) {
                    mapInstanceRef.current.fitBounds(circleOverlayRef.current.getBounds(), { padding: [28, 28] });
                  } else {
                    mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lon], 12);
                  }
                  setSelectedProviderId(null);
                }
              }}
              title="Reset View to Full Search Radius"
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                zIndex: 1000,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 650,
                color: '#334155',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="12 8 8 12 12 16 16 12 12 8" />
              </svg>
              <span>Recenter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
