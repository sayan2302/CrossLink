'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortalConfig } from '@/config/tenants';
import { useToast } from '@/context/ToastContext';

interface ProfileViewProps {
  portal: PortalConfig;
  user: {
    username: string;
    role: string;
  };
  onBack: () => void;
}

interface UserProfileData {
  userId?: number;
  userName?: string;
  loginName?: string;
  emailId?: string;
  mobile?: string;
  address?: string;
  altMobile?: string;
  altEmailId?: string;
  profileImgUrl?: string;
  phonePrefix?: string;
  role?: string;
}

export default function ProfileView({ portal, user, onBack }: ProfileViewProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfileData>({
    userName: user.username,
    loginName: user.username,
    emailId: '',
    mobile: '',
    address: '',
    phonePrefix: portal.portalKey.includes('Lawton') ? '+66-' : '+91-',
    role: portal.role,
  });

  const [loading, setLoading] = useState(true);
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicSubmitting, setBasicSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Form states for Basic Info edit
  const [editAddress, setEditAddress] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Form states for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alerts
  const [basicAlert, setBasicAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordAlert, setPasswordAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleOpenPasswordModal = () => {
    setPasswordAlert(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordAlert(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [profile.profileImgUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isPasswordModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClosePasswordModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPasswordModalOpen]);

  // Fetch initial profile data on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data: UserProfileData = await res.json();
          if (isMounted && data) {
            setProfile((prev) => ({
              ...prev,
              ...data,
              userName: data.userName || prev.userName,
              emailId: data.emailId || prev.emailId,
              mobile: data.mobile || '',
              address: data.address ?? prev.address,
              phonePrefix: data.phonePrefix || (portal.portalKey.includes('Lawton') ? '+66-' : '+91-'),
            }));
            setEditAddress(data.address || '');
            setEditMobile(data.mobile || '');
            setEditEmail(data.emailId || '');
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [portal.portalKey]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['png', 'jpg', 'jpeg'].includes(ext || '')) {
      toast.error('Allowed Profile pic extensions: png, jpg, jpeg', 'Invalid File Type');
      return;
    }

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => ({
          ...prev,
          profileImgUrl: data.profileImgUrl || prev.profileImgUrl,
        }));
        toast.success('Profile picture updated successfully.', 'Photo Uploaded');
      } else {
        toast.error(data.error || data.message || 'Failed to upload photo.', 'Upload Failed');
      }
    } catch {
      toast.error('Error uploading profile picture. Please try again.', 'Upload Failed');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Basic Info Save
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBasicAlert(null);

    if (!editAddress.trim()) {
      setBasicAlert({ type: 'error', message: 'Please enter your address.' });
      return;
    }
    if (!editMobile.trim() || editMobile.trim().length < 8) {
      setBasicAlert({ type: 'error', message: 'Please enter a valid mobile number (at least 8 digits).' });
      return;
    }
    if (!editEmail.trim() || !/^\S+@\S+\.\S+$/.test(editEmail.trim())) {
      setBasicAlert({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setBasicSubmitting(true);
    try {
      const res = await fetch('/api/profile/basic-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: editAddress.trim(),
          mobile: editMobile.trim(),
          email: editEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => ({
          ...prev,
          address: editAddress.trim(),
          mobile: editMobile.trim(),
          emailId: editEmail.trim(),
        }));
        setIsEditingBasic(false);
        setBasicAlert({ type: 'success', message: 'Submitted successfully' });
        toast.success('Basic information updated successfully.');
      } else {
        const msg = data.error || data.message || 'Information cannot be updated, please try again.';
        setBasicAlert({ type: 'error', message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = 'Failed to update basic information. Please try again.';
      setBasicAlert({ type: 'error', message: msg });
      toast.error(msg);
    } finally {
      setBasicSubmitting(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordAlert({
        type: 'error',
        message: 'Please enter all the 3 fields and make sure new password matches to confirm password.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordAlert({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    // Complexity validation: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~!#$@%^&*()_+|\\'\-={}[\]:";<>?,.\/])[A-Za-z\d~!#$@%^&*()_+|\\'\-={}[\]:";<>?,.\/]{8,}/;
    if (!complexityRegex.test(newPassword)) {
      setPasswordAlert({
        type: 'error',
        message:
          'New password must contain at least 8 characters with at least one uppercase letter, one lowercase letter, one digit and one special character.',
      });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password changed successfully.');
        setIsPasswordModalOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordAlert(null);
      } else {
        const msg = data.error || data.message || 'Password could not be updated. Please verify your old password.';
        setPasswordAlert({ type: 'error', message: msg });
        toast.error(msg);
      }
    } catch {
      const msg = 'Failed to update password. Please try again later.';
      setPasswordAlert({ type: 'error', message: msg });
      toast.error(msg);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const resolveProfileImage = (url?: string) => {
    if (!url || url === '/images/profile-avatar.png') return null;
    if (
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/api/')
    ) {
      return url;
    }
    return `/api/profile/dms-image?fileGuid=${encodeURIComponent(url)}`;
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 20px' }}>
      {/* BREADCRUMB */}
      <nav aria-label="breadcrumb" style={{ marginBottom: '24px' }}>
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          listStyle: 'none',
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          margin: 0
        }}>
          <li>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: portal.accentColor,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px'
              }}
            >
              Home
            </button>
          </li>
          <li style={{ color: '#94a3b8' }}>/</li>
          <li style={{ color: '#64748b', fontWeight: 500 }}>Profile</li>
        </ol>
      </nav>

      {/* MAIN TWO-COLUMN PROFILE WRAPPER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: AVATAR & IDENTITY */}
        <div style={{
          backgroundColor: '#e2e8f0',
          borderRadius: '16px',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          border: '1px solid #cbd5e1'
        }}>
          {/* Avatar Circle */}
          <div style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: `3px solid ${portal.accentColor}`,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
            marginBottom: '18px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {loading ? (
              <div className="crosslink-skeleton" style={{ width: '100%', height: '100%' }} />
            ) : (() => {
              const imgSrc = resolveProfileImage(profile.profileImgUrl);
              if (imgSrc && !imageError) {
                return (
                  <img
                    src={imgSrc}
                    alt={profile.userName || 'Profile Picture'}
                    onError={() => setImageError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                );
              }
              const initial = (profile.userName || user.username || 'U').charAt(0).toUpperCase();
              return (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${portal.accentColor} 0%, #0f172a 100%)`,
                  color: '#ffffff',
                  fontSize: '44px',
                  fontWeight: 700,
                  userSelect: 'none'
                }}>
                  {initial}
                </div>
              );
            })()}

            {photoUploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Uploading...
              </div>
            )}
          </div>

          {/* Update Photo Link */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept=".png,.jpg,.jpeg"
              style={{ display: 'none' }}
              id="profilePhotoUploadInput"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                background: 'none',
                border: 'none',
                color: portal.accentColor,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Update profile pic
            </button>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              margin: '4px 0 0 0',
              lineHeight: 1.4
            }}>
              Allowed Profile pic extensions : png, jpg, jpeg
            </p>
          </div>

          {/* User Details Box */}
          <div style={{
            marginTop: '12px',
            width: '100%',
            borderTop: '1px solid #cbd5e1',
            paddingTop: '16px'
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div className="crosslink-skeleton" style={{ width: '140px', height: '18px', borderRadius: '4px' }} />
                <div className="crosslink-skeleton" style={{ width: '180px', height: '14px', borderRadius: '4px' }} />
              </div>
            ) : (
              <>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 6px 0'
                }}>
                  {profile.userName || user.username}
                </h4>
                {profile.emailId && (
                  <p style={{
                    fontSize: '13px',
                    color: '#475569',
                    margin: 0,
                    wordBreak: 'break-all'
                  }}>
                    <span style={{ fontWeight: 600 }}>Email ID : </span>
                    <a href={`mailto:${profile.emailId}`} style={{ color: portal.accentColor, textDecoration: 'none' }}>
                      {profile.emailId}
                    </a>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BASIC INFO & CHANGE PASSWORD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* CARD 1: BASIC INFORMATION */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: portal.accentColor }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Basic information
              </h3>

              {!isEditingBasic ? (
                <button
                  type="button"
                  onClick={() => {
                    setBasicAlert(null);
                    setIsEditingBasic(true);
                  }}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBasic(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Basic Info Feedback Alert */}
            {basicAlert && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: basicAlert.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: basicAlert.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${basicAlert.type === 'success' ? '#a7f3d0' : '#fecaca'}`
              }}>
                {basicAlert.message}
              </div>
            )}

            {/* VIEW MODE */}
            {!isEditingBasic ? (
              loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: '18px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Name</span>
                  <div className="crosslink-skeleton" style={{ width: '180px', height: '16px', borderRadius: '4px' }} />

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Address<span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <div className="crosslink-skeleton" style={{ width: '260px', height: '16px', borderRadius: '4px' }} />

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Mobile Phone<span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <div className="crosslink-skeleton" style={{ width: '140px', height: '16px', borderRadius: '4px' }} />

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Email address</span>
                  <div className="crosslink-skeleton" style={{ width: '220px', height: '16px', borderRadius: '4px' }} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: '18px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Name</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{profile.userName || user.username || '—'}</span>

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Address<span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <span style={{ fontSize: '14px', color: profile.address ? '#0f172a' : '#94a3b8' }}>
                    {profile.address || 'No address provided'}
                  </span>

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Mobile Phone<span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontFamily: 'monospace', fontWeight: 600 }}>
                    {profile.mobile ? `${profile.phonePrefix || ''}${profile.mobile}` : '—'}
                  </span>

                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Email address</span>
                  <span style={{ fontSize: '14px', color: '#0f172a' }}>{profile.emailId || '—'}</span>
                </div>
              )
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSaveBasicInfo}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Name (Readonly) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Name</label>
                    <input
                      type="text"
                      disabled
                      value={profile.userName || ''}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        color: '#64748b',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                      Address<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Enter address"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Mobile Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                      Mobile Phone<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        padding: '10px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRight: 'none',
                        borderRadius: '8px 0 0 8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#475569'
                      }}>
                        {profile.phonePrefix}
                      </span>
                      <input
                        type="tel"
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={12}
                        placeholder="10-digit mobile"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '0 8px 8px 0',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                      Email address<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingBasic(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={basicSubmitting}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {basicSubmitting ? 'Saving...' : 'Make Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* CHANGE PASSWORD BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #dc2626',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change password
            </button>
          </div>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClosePasswordModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div style={{ height: '4px', backgroundColor: '#dc2626', width: '100%' }} />

            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h3 id="change-password-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Change Password
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Enter your current password and choose a secure new password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleChangePassword}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Requirements note */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#475569',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Password Requirements:</strong>
                  • Minimum 8 characters<br />
                  • At least one uppercase letter (A-Z) and one lowercase letter (a-z)<br />
                  • At least one digit (0-9) and one special character (~!#$@%^&amp;*()_+-={}[];:&lt;&gt;?,./)
                </div>

                {/* Password Feedback Alert */}
                {passwordAlert && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: passwordAlert.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: passwordAlert.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${passwordAlert.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {passwordAlert.message}
                  </div>
                )}

                {/* Old Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Current password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showOldPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    New password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showNewPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Confirm new password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={passwordSubmitting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                >
                  {passwordSubmitting ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
