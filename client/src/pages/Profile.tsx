import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Shield,
  Edit3,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building2,
  FileText,
} from 'lucide-react';
import { ScrollReveal, FadeIn, ScaleIn } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import type { User as UserType } from '@/types';
import api from '@/services/api';
import { authService } from '@/services/authService';

// --- Schemas ---

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// --- Helpers ---

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function accountAge(createdAt?: string): string {
  if (!createdAt) return 'N/A';
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years} yr${years !== 1 ? 's' : ''} ${rem} mo`
    : `${years} year${years !== 1 ? 's' : ''}`;
}

// --- Toast ---

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        type === 'success'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

// --- Main Component ---

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [editingProfile, setEditingProfile] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [stats, setStats] = useState<{ reports: number; upvotes: number }>({
    reports: 0,
    upvotes: 0,
  });

  // Fetch stats on mount
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const res = await api.get('/reports/my');
        const data = res.data;
        const reportsList = data.data || data;
        const reports = Array.isArray(reportsList) ? reportsList.length : 0;
        const upvotes = Array.isArray(reportsList)
          ? reportsList.reduce(
              (sum: number, r: any) => sum + (r.upvotes || 0),
              0,
            )
          : 0;
        setStats({ reports, upvotes });
      } catch {
        // Silently fail - stats are non-critical
      }
    };
    fetchStats();
  }, [token]);

  // --- Profile Form ---

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const onProfileSave = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      const result = await authService.updateProfile(data);

      const updatedUser =
        result.data?.user || result.user || result.data || { ...user, ...data };
      setUser(updatedUser as UserType);
      setEditingProfile(false);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Password Form ---

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSave = async (data: PasswordFormData) => {
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      resetPassword();
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to change password',
        type: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // --- Photo Upload ---

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const result = await authService.uploadProfilePhoto(formData);

      const photoUrl =
        result.data?.profilePhoto ||
        result.profilePhoto ||
        result.data?.url;
      if (photoUrl && user) {
        setUser({ ...user, profilePhoto: photoUrl });
      }
      setToast({ message: 'Profile photo updated', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to upload photo',
        type: 'error',
      });
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // --- Derived ---

  const roleLabel =
    user?.role === 'student'
      ? 'Student'
      : user?.role === 'owner'
        ? 'Property Owner'
        : 'Admin';

  const roleColor =
    user?.role === 'student'
      ? 'bg-blue-100 text-blue-700'
      : user?.role === 'owner'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-purple-100 text-purple-700';

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <User className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-4 text-slate-600">
              Please log in to view your profile.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20" />
          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-white/10" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <ScaleIn>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* Avatar */}
              <div className="group relative">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 text-2xl font-bold text-white shadow-lg sm:h-28 sm:w-28"
                  style={{
                    backgroundImage:
                      photoPreview || user.profilePhoto
                        ? `url(${photoPreview || user.profilePhoto})`
                        : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!(photoPreview || user.profilePhoto) &&
                    getInitials(user.name)}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-md transition-transform hover:scale-110"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>

              {/* Name / Email / Badges */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {user.name}
                </h1>
                <p className="mt-1 flex items-center justify-center gap-1 text-blue-100 sm:justify-start">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${roleColor}`}
                  >
                    {user.role === 'owner' ? (
                      <Building2 className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {roleLabel}
                  </span>
                  {user.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {/* Stats Row */}
        <ScrollReveal>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: <FileText className="h-5 w-5 text-blue-600" />,
                label: 'Reports Filed',
                value: stats.reports,
              },
              {
                icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
                label: 'Upvotes Received',
                value: stats.upvotes,
              },
              {
                icon: <Shield className="h-5 w-5 text-indigo-600" />,
                label: 'Account Age',
                value: accountAge(user.createdAt),
              },
            ].map((s) => (
              <Card key={s.label} className="border-slate-100">
                <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
                  {s.icon}
                  <span className="text-xl font-bold text-slate-800">
                    {s.value}
                  </span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>

        {/* Personal Info */}
        <ScrollReveal delay={100}>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              {!editingProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingProfile(true)}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <Edit3 className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={submitProfile(onProfileSave)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...regProfile('name')}
                        disabled={!editingProfile}
                        className="pl-10"
                        placeholder="Your name"
                      />
                    </div>
                    {profileErrors.name && (
                      <p className="text-xs text-red-500">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...regProfile('email')}
                        disabled={!editingProfile}
                        className="pl-10"
                        placeholder="you@example.com"
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="text-xs text-red-500">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...regProfile('phone')}
                      disabled={!editingProfile}
                      className="pl-10"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                {editingProfile && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingProfile(false);
                        resetProfile();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {savingProfile ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Change Password */}
        <ScrollReveal delay={200}>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-blue-600" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={submitPassword(onPasswordSave)}
                className="space-y-4"
              >
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...regPassword('currentPassword')}
                      type={showCurrentPw ? 'text' : 'password'}
                      className="pl-10 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-red-500">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...regPassword('newPassword')}
                        type={showNewPw ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...regPassword('confirmPassword')}
                        type={showConfirmPw ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {savingPassword ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Profile Photo */}
        <ScrollReveal delay={250}>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-blue-600" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-200 text-lg font-semibold text-slate-400"
                  style={{
                    backgroundImage:
                      photoPreview || user.profilePhoto
                        ? `url(${photoPreview || user.profilePhoto})`
                        : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!(photoPreview || user.profilePhoto) &&
                    getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    Upload a clear photo of yourself. This helps others
                    recognize you.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    Choose Photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Verification Status */}
        <ScrollReveal delay={300}>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* College Email Verification */}
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${user.isVerified ? 'bg-emerald-100' : 'bg-slate-100'}`}
                    >
                      {user.isVerified ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        College Email Verified
                      </p>
                      <p className="text-sm text-slate-500">
                        {user.isVerified
                          ? 'Your college email has been verified'
                          : 'Verify your college email to build trust'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                {/* Owner Verification */}
                {user.role === 'owner' && (
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          user.ownerVerification?.status === 'verified'
                            ? 'bg-emerald-100'
                            : user.ownerVerification?.status === 'pending' ||
                                user.ownerVerification?.status ===
                                  'under_review'
                              ? 'bg-amber-100'
                              : user.ownerVerification?.status === 'rejected'
                                ? 'bg-red-100'
                                : 'bg-slate-100'
                        }`}
                      >
                        <Building2
                          className={`h-5 w-5 ${
                            user.ownerVerification?.status === 'verified'
                              ? 'text-emerald-600'
                              : user.ownerVerification?.status === 'pending' ||
                                  user.ownerVerification?.status ===
                                    'under_review'
                                ? 'text-amber-600'
                                : user.ownerVerification?.status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          Owner Verification
                        </p>
                        <p className="text-sm text-slate-500">
                          {user.ownerVerification?.status === 'verified'
                            ? 'Your property ownership has been verified'
                            : user.ownerVerification?.status === 'pending' ||
                                user.ownerVerification?.status ===
                                  'under_review'
                              ? 'Your verification is being reviewed'
                              : user.ownerVerification?.status === 'rejected'
                                ? `Rejected: ${user.ownerVerification?.rejectionReason || 'Please resubmit'}`
                                : 'Submit documents to verify property ownership'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.ownerVerification?.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-700'
                          : user.ownerVerification?.status === 'pending' ||
                              user.ownerVerification?.status === 'under_review'
                            ? 'bg-amber-100 text-amber-700'
                            : user.ownerVerification?.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {user.ownerVerification?.status === 'verified'
                        ? 'Verified'
                        : user.ownerVerification?.status === 'pending'
                          ? 'Pending'
                          : user.ownerVerification?.status === 'under_review'
                            ? 'Under Review'
                            : user.ownerVerification?.status === 'rejected'
                              ? 'Rejected'
                              : 'None'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Profile;
