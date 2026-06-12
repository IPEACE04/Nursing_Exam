"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building, Save, Lock, KeyRound, Shield, Camera } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { changePassword } from "@/actions/auth";
import { uploadAvatar, updateProfile } from "@/actions/profile";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { FormField } from "@/components/premium/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (profile && !hasInitialized.current) {
      hasInitialized.current = true;
      setName(profile.name || "");
      setUniversity(profile.university || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("university", university);

    await updateProfile(formData);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadAvatar(formData);
    if (result.error) {
      alert(result.error);
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
        title="โปรไฟล์"
        description="จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี"
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
              <Avatar className="size-16 sm:size-20 ring-2 ring-primary/20 shadow-clinic transition-opacity group-hover:opacity-80">
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
              <div className="rounded-full bg-primary/10 p-1">
                <User className="size-3 sm:size-4 text-primary" />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {profile?.name || "ผู้ใช้"}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.email}</p>
              <span className="text-muted-foreground/30 hidden sm:inline">·</span>
              <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary">
                {profile?.role === "admin" ? (
                  <><Shield className="size-3.5" /> ผู้ดูแลระบบ</>
                ) : (
                  "นักศึกษา"
                )}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 sm:space-y-6">
          <FormField
            id="email"
            label="อีเมล"
            icon={Mail}
            type="email"
            value={user?.email ?? ""}
            disabled
          />

          <FormField
            id="name"
            label="ชื่อ-นามสกุล"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormField
            id="university"
            label="มหาวิทยาลัย"
            icon={Building}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="ชื่อมหาวิทยาลัย"
          />

          <button type="submit" disabled={saving} className="btn-premium">
            <Save className="size-5" />
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว ✓" : "บันทึกข้อมูล"}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3 sm:gap-4">
          <div className="flex size-11 sm:size-13 items-center justify-center rounded-xl bg-primary/8 border border-primary/15 shrink-0">
            <Lock className="size-5 sm:size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-sm text-muted-foreground">
              ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5 sm:space-y-6">
          <FormField
            id="newPassword"
            label="รหัสผ่านใหม่"
            icon={KeyRound}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
          />

          <FormField
            id="confirmPassword"
            label="ยืนยันรหัสผ่าน"
            icon={KeyRound}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {passwordError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive border border-destructive/20">
              {passwordError}
            </p>
          )}

          <button type="submit" className="btn-premium-outline">
            <KeyRound className="size-5" />
            {passwordSaved ? "เปลี่ยนรหัสผ่านแล้ว ✓" : "เปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
