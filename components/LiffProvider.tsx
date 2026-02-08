"use client";

import { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";

// 1. กำหนด Type ให้ชัดเจน (แก้ปัญหา Unexpected any)
interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

type LiffContextType = {
  liffObject: typeof liff | null;
  profile: LiffProfile | null;
  isLoggedIn: boolean;
  userId: string | null;
  login: () => void;
  logout: () => void;
};

const LiffContext = createContext<LiffContextType>({
  liffObject: null,
  profile: null,
  isLoggedIn: false,
  userId: null,
  login: () => {},
  logout: () => {},
});

export const useLiff = () => useContext(LiffContext);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  // 2. ใช้ Type ที่เรากำหนดข้างบน แทนการใช้ any
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

        // 3. ย้าย Logic การ Login มาไว้ในนี้เลย (แก้ปัญหา handleLoginSuccess is accessed before initialization)
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          try {
            const userProfile = await liff.getProfile();
            setProfile(userProfile);

            // ดึง userId (sub) จาก ID Token จะชัวร์กว่า
            const context = liff.getContext();
            if (context && context.userId) {
              setUserId(context.userId);
            } else {
              setUserId(userProfile.userId);
            }
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
      window.location.reload(); // รีโหลดหน้าเพื่อเคลียร์ state
    }
  };

  return (
    <LiffContext.Provider
      value={{ liffObject, profile, isLoggedIn, userId, login, logout }}
    >
      {children}
    </LiffContext.Provider>
  );
}
