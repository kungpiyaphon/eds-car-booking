"use client";

import { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";
import { supabase } from "@/lib/supabase"; // ✅ เพิ่ม: import supabase

// 1. กำหนด Type ให้ชัดเจน
interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// ✅ เพิ่ม: Type ของ User ใน DB
type DbUser = {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
  department: string;
};

type LiffContextType = {
  liffObject: typeof liff | null;
  profile: LiffProfile | null;
  isLoggedIn: boolean;
  userId: string | null;
  dbUser: DbUser | null; // ✅ เพิ่ม: ตัวแปรเก็บข้อมูลพนักงานจริง
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>; // ✅ เพิ่ม: ฟังก์ชันรีโหลดข้อมูล (ใช้ตอนผูกบัญชีเสร็จ)
};

const LiffContext = createContext<LiffContextType>({
  liffObject: null,
  profile: null,
  isLoggedIn: false,
  userId: null,
  dbUser: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const useLiff = () => useContext(LiffContext);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null); // ✅ State สำหรับ DB User
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ ฟังก์ชันดึงข้อมูล User จาก Supabase ด้วย LINE ID
  const fetchDbUser = async (lineUserId: string) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("line_user_id", lineUserId)
        .single();

      if (data) {
        setDbUser(data);
      } else {
        setDbUser(null); // ไม่พบข้อมูล (ต้องให้ User ลงทะเบียนผูกบัญชี)
      }
    } catch (error) {
      console.error("Error fetching DB user:", error);
    }
  };

  useEffect(() => {
    async function initLiff() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          console.warn("LIFF ID is missing in .env");
          return;
        }

        await liff.init({ liffId });
        setLiffObject(liff);

        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          try {
            const userProfile = await liff.getProfile();
            setProfile(userProfile);

            let currentUserId = userProfile.userId;
            const context = liff.getContext();
            if (context && context.userId) {
              currentUserId = context.userId;
            }
            setUserId(currentUserId);

            // ✅ เมื่อได้ LINE ID แล้ว ให้ไปดึงข้อมูลพนักงานทันที
            await fetchDbUser(currentUserId);
          } catch (error) {
            console.error("LIFF Get Profile Error", error);
          }
        }
      } catch (e) {
        console.error("LIFF Init Failed", e);
      }
    }
    initLiff();
  }, []);

  const login = () => {
    if (liffObject && !isLoggedIn) {
      liffObject.login();
    }
  };

  const logout = () => {
    if (liffObject && isLoggedIn) {
      liffObject.logout();
      setIsLoggedIn(false);
      setProfile(null);
      setUserId(null);
      setDbUser(null);
      window.location.reload();
    }
  };

  const refreshUser = async () => {
    if (userId) await fetchDbUser(userId);
  };

  return (
    <LiffContext.Provider
      value={{
        liffObject,
        profile,
        isLoggedIn,
        userId,
        dbUser,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}
