import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PageLayout from "../shared/PageLayout";
import PageHeader from "../shared/PageHeader";
import farmerAvatar from "../assets/images/mada-dashboard.png";
import { useFarmerProfile } from "../hooks/useFarmerProfile";
import { supabase } from "../supabase/supabase-client";
import "../css/FarmerProfile.css";

interface FarmerProfileProps {
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
}

function FarmerProfile({ onLogout, onNavigate }: FarmerProfileProps) {
  const { profile, loading, error } = useFarmerProfile();
  const [updatedProfile, setUpdatedProfile] = useState<{
    full_name: string;
    address: string;
    avatar_path: string | null;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);

  const currentAvatarPath =
    updatedProfile?.avatar_path ?? profile?.avatar_path ?? null;

  useEffect(() => {
    if (!currentAvatarPath) {
      setAvatarUrl(null);
      setAvatarLoadError(null);
      return;
    }

    let cancelled = false;
    void supabase.storage
      .from("profile-avatars")
      .createSignedUrl(currentAvatarPath, 60 * 60)
      .then(({ data, error: signedUrlError }) => {
        if (cancelled) return;
        if (signedUrlError) {
          setAvatarLoadError(signedUrlError.message);
          return;
        }
        setAvatarUrl(data.signedUrl);
        setAvatarLoadError(null);
      })
      .catch((signedUrlError: unknown) => {
        if (cancelled) return;
        setAvatarLoadError(
          signedUrlError instanceof Error
            ? signedUrlError.message
            : "Unable to load your saved profile photo."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [currentAvatarPath]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const openEdit = () => {
    if (!profile) return;
    setName(updatedProfile?.full_name ?? profile.full_name);
    setAddress(updatedProfile?.address ?? profile.address);
    setAvatarFile(null);
    setSaveError(null);
    setSaveSuccess(false);
    setEditOpen(true);
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || saving) return;

    const fullName = name.trim();
    const farmerAddress = address.trim();
    if (!fullName || !farmerAddress) {
      setSaveError("Please enter both your name and address.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    let uploadedAvatarPath: string | null = null;
    try {
      if (avatarFile) {
        const extension = avatarFile.name.includes(".")
          ? avatarFile.name.split(".").pop()?.toLowerCase()
          : "jpg";
        uploadedAvatarPath = `${profile.id}/avatar-${crypto.randomUUID()}.${extension || "jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-avatars")
          .upload(uploadedAvatarPath, avatarFile, {
            cacheControl: "3600",
            contentType: avatarFile.type,
            upsert: false,
          });

        if (uploadError) {
          setSaveError(uploadError.message);
          return;
        }
      }

      const { data, error: updateError } = await supabase
        .from("farmers")
        .update({
          full_name: fullName,
          address: farmerAddress,
          ...(uploadedAvatarPath ? { avatar_path: uploadedAvatarPath } : {}),
        })
        .eq("id", profile.id)
        .select("full_name, address, avatar_path")
        .maybeSingle();

      if (updateError) {
        if (uploadedAvatarPath) {
          const { error: cleanupError } = await supabase.storage
            .from("profile-avatars")
            .remove([uploadedAvatarPath]);
          setSaveError(
            cleanupError
              ? `${updateError.message} The uploaded photo could not be cleaned up: ${cleanupError.message}`
              : updateError.message
          );
          return;
        }
        setSaveError(updateError.message);
        return;
      }
      if (!data) {
        if (uploadedAvatarPath) {
          const { error: cleanupError } = await supabase.storage
            .from("profile-avatars")
            .remove([uploadedAvatarPath]);
          setSaveError(
            cleanupError
              ? `Your profile could not be updated. The uploaded photo could not be cleaned up: ${cleanupError.message}`
              : "Your profile could not be updated. Please try again."
          );
          return;
        }
        setSaveError("Your profile could not be updated. Please try again.");
        return;
      }

      setUpdatedProfile(data);
      setSaveSuccess(true);
      setAvatarFile(null);
      if (
        uploadedAvatarPath &&
        currentAvatarPath &&
        currentAvatarPath !== uploadedAvatarPath
      ) {
        const { error: removeOldAvatarError } = await supabase.storage
          .from("profile-avatars")
          .remove([currentAvatarPath]);
        if (removeOldAvatarError) {
          setSaveError(
            `Profile updated, but the previous photo could not be removed: ${removeOldAvatarError.message}`
          );
        }
      }
    } catch (updateError) {
      if (uploadedAvatarPath) {
        const { error: cleanupError } = await supabase.storage
          .from("profile-avatars")
          .remove([uploadedAvatarPath]);
        if (cleanupError) {
          setSaveError(
            `${updateError instanceof Error ? updateError.message : "Unable to update your profile."} The uploaded photo could not be cleaned up: ${cleanupError.message}`
          );
          return;
        }
      }
      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const currentName = updatedProfile?.full_name ?? profile?.full_name;
  const currentAddress = updatedProfile?.address ?? profile?.address;
  const currentAvatar = avatarUrl ?? farmerAvatar;

  if (loading) {
    return (
      <PageLayout
        activeTab="Profile"
        onNavigate={onNavigate}
        loading
        loadingText="Loading your profile..."
      >
        {null}
      </PageLayout>
    );
  }

  if (error || !profile) {
    return (
      <PageLayout activeTab="Profile" onNavigate={onNavigate}>
        <div className="profile-content">
          <PageHeader title="Profile" align="left" />
          <p className="profile-error" role="alert">
            {error ?? 'Unable to load your profile.'}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="Profile" onNavigate={onNavigate}>
      <div className="profile-content">

        <PageHeader
          title="Profile"
          align="left"
        />

        {/* MAIN PROFILE CARD */}
        <div className="profile-card">

          {/* USER INFO HEADER */}
          <div className="profile-user-header">
            <div className="profile-avatar-box">
              <img src={currentAvatar} alt="Farmer profile" />
            </div>
            <div className="profile-user-details">
              <h3 className="profile-user-name">
                {currentName || 'Name not provided'}
              </h3>
              <span className="profile-user-role">Farmer</span>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="profile-contact-list">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>{profile.email || 'Email not provided'}</span>
            </div>

            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{currentAddress || 'Address not provided'}</span>
            </div>
          </div>

          <button
            type="button"
            className="profile-edit-button"
            onClick={openEdit}
          >
            Edit Profile
          </button>

          {/* MENU NAVIGATION LINKS */}
          <div className="profile-menu">
            <button className="menu-item" onClick={() => onNavigate?.("farms")}>
              <div className="menu-label">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>My Farms</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button className="menu-item" onClick={() => onNavigate?.("settings")}>
              <div className="menu-label">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button className="menu-item" onClick={() => onNavigate?.("help")}>
              <div className="menu-label">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Help & Support</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button className="menu-item logout-item" onClick={onLogout}>
              <div className="menu-label">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

        </div>

      </div>
      {editOpen &&
        createPortal(
          <div
            className="profile-edit-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setEditOpen(false);
              }
            }}
          >
            <section
              className="profile-edit-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-edit-title"
            >
              <div className="profile-edit-header">
                <h2 id="profile-edit-title">
                  {saveSuccess ? "Profile updated" : "Edit Profile"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  aria-label="Close"
                  disabled={saving}
                >
                  ×
                </button>
              </div>
              {saveSuccess ? (
                <>
                  <div className="profile-edit-success" role="status">
                    Your profile has been updated successfully.
                  </div>
                  {saveError && (
                    <p className="profile-edit-error" role="alert">
                      {saveError}
                    </p>
                  )}
                </>
              ) : (
                <form onSubmit={handleSaveProfile}>
                  {saveError && (
                    <p className="profile-edit-error" role="alert">
                      {saveError}
                    </p>
                  )}
                  <div className="profile-avatar-editor">
                    <img
                      src={avatarPreview ?? currentAvatar}
                      alt="Profile preview"
                    />
                    <label
                      className="profile-avatar-picker"
                      htmlFor="profile-avatar"
                    >
                      {avatarFile ? "Choose a different photo" : "Change photo"}
                    </label>
                    <input
                      id="profile-avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (
                          !["image/jpeg", "image/png", "image/webp"].includes(
                            file.type
                          )
                        ) {
                          setSaveError("Choose a JPG, PNG, or WebP image.");
                          event.target.value = "";
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setSaveError(
                            "Profile photos must be 5 MB or smaller."
                          );
                          event.target.value = "";
                          return;
                        }
                        setSaveError(null);
                        setAvatarFile(file);
                      }}
                      disabled={saving}
                    />
                  </div>
                  {avatarLoadError && !avatarPreview && (
                    <p className="profile-edit-error" role="alert">
                      Unable to load your saved profile photo: {avatarLoadError}
                    </p>
                  )}
                  <label htmlFor="profile-full-name">Full name</label>
                  <input
                    id="profile-full-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    disabled={saving}
                  />
                  <label htmlFor="profile-address">Address</label>
                  <input
                    id="profile-address"
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    required
                    disabled={saving}
                  />
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </form>
              )}
            </section>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}

export default FarmerProfile;