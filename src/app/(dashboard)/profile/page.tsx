"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building, Save, Lock, KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { FormField } from "@/components/premium/form-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUniversity(profile.university || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("profiles")
      .update({ name, university })
      .eq("id", user.id);

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
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
      className="mx-auto max-w-2xl space-y-8"
    >
      <PageHeader
        badge="Profile"
        title="โปรไฟล์"
        description="จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี"
      />

      <GlassCard>
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16 ring-2 ring-accent/30">
            <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {profile?.name || "ผู้ใช้"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
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
            <Save className="size-4" />
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว ✓" : "บันทึกข้อมูล"}
          </button>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8">
            <Lock className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-xs text-muted-foreground">
              ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
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
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {passwordError}
            </p>
          )}

          <button type="submit" className="btn-premium-outline">
            <KeyRound className="size-4" />
            {passwordSaved ? "เปลี่ยนรหัสผ่านแล้ว ✓" : "เปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
