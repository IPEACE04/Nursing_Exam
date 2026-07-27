"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building, Save, Lock, KeyRound, Shield, Camera, IdCard } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { changePassword } from "@/actions/auth";
import { uploadAvatar, updateProfile } from "@/actions/profile";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { FormField } from "@/components/premium/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [studentId, setStudentId] = useState("");
  const [gpa, setGpa] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (profile && !hasInitialized.current) {
      hasInitialized.current = true;
      setName(profile.name || "");
      setUniversity(profile.university || "");
      setGender(profile.gender || "");
      setAge(profile.age ? String(profile.age) : "");
      setStudentId(profile.student_id || "");
      setGpa(profile.gpa ? String(profile.gpa) : "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("university", university);
    formData.set("gender", gender);
    formData.set("age", age);
    formData.set("studentId", studentId);
    formData.set("gpa", gpa);

    await updateProfile(formData);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError(t(locale, "profile.imageTooLarge"));
      return;
    }

    setAvatarError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadAvatar(formData);
    if (result.error) {
      setAvatarError(result.error);
    } else {
      await refreshProfile();
    }
    setUploading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    const formData = new FormData();
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const result = await changePassword(formData);

    if (result?.error) {
      setPasswordError(result.error);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  }

  const initials = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-8 sm:space-y-10"
    >
      <PageHeader
        badge="Profile"
        title={t(locale, "profile.title")}
        description={t(locale, "profile.desc")}
      />

      <GlassCard className="p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-4 sm:gap-6">
          <div className="relative shrink-0 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/heic"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative cursor-pointer disabled:cursor-wait"
            >
              <Avatar className="size-16 sm:size-20 ring-1 ring-border transition-opacity group-hover:opacity-80">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-xl sm:text-2xl font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-5 text-white" />
                </div>
              )}
            </button>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-card border-2 border-card p-0.5">
              <div className="rounded-full border border-border/60 bg-muted p-1">
                <User className="size-3 sm:size-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          {avatarError && <p className="text-sm text-destructive mt-1">{avatarError}</p>}
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {profile?.name || t(locale, "common.user")}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.email}</p>
              <span className="text-muted-foreground/30 hidden sm:inline">·</span>
              <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary">
                {profile?.role === "admin" ? (
                  <><Shield className="size-3.5" /> {t(locale, "common.adminRole")}</>
                ) : (
                  t(locale, "common.student")
                )}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 sm:space-y-6">
          <FormField
            id="email"
            label={t(locale, "auth.email")}
            icon={Mail}
            type="email"
            value={user?.email ?? ""}
            disabled
          />

          <FormField
            id="name"
            label={t(locale, "register.name")}
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />

          <FormField
            id="university"
            label={t(locale, "profile.university")}
            icon={Building}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder={t(locale, "profile.universityPlaceholder")}
            autoComplete="off"
          />

          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-foreground">
              {t(locale, "register.gender")}
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="">{t(locale, "register.gender.none")}</option>
              <option value="ชาย">{t(locale, "register.gender.male")}</option>
              <option value="หญิง">{t(locale, "register.gender.female")}</option>
              <option value="อื่นๆ">{t(locale, "register.gender.other")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "register.age")}
              </label>
              <input
                id="age"
                type="number"
                min={15}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t(locale, "register.age")}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label htmlFor="gpa" className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "register.gpa")}
              </label>
              <input
                id="gpa"
                type="number"
                min={0}
                max={4}
                step={0.01}
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder={t(locale, "register.gpaPlaceholder")}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <FormField
            id="studentId"
            label={t(locale, "profile.studentId")}
            icon={IdCard}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder={t(locale, "profile.studentId")}
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="size-5" />
            {saving ? t(locale, "common.saving") : saved ? t(locale, "common.saved") : t(locale, "common.save")}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3 sm:gap-4">
          <Lock className="size-6 text-primary shrink-0" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t(locale, "profile.changePassword")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(locale, "profile.changePasswordDesc")}
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5 sm:space-y-6">
          <FormField
            id="newPassword"
            label={t(locale, "profile.newPassword")}
            icon={KeyRound}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="off"
            minLength={6}
          />

          <FormField
            id="confirmPassword"
            label={t(locale, "profile.confirmPassword")}
            icon={KeyRound}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="off"
          />

          {passwordError && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-base text-destructive">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-transparent px-6 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
          >
            <KeyRound className="size-5" />
            {passwordSaved ? t(locale, "profile.passwordChanged") : t(locale, "profile.changeBtn")}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
