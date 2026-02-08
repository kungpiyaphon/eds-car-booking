"use client";

import { useState } from "react";
import { useLiff } from "@/components/LiffProvider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CarFront, History, UserCheck, Loader2, KeyRound } from "lucide-react";

export default function Home() {
  const { isLoggedIn, userId, dbUser, refreshUser, login } = useLiff();
  const [employeeId, setEmployeeId] = useState("");
  const [registering, setRegistering] = useState(false);

  // ฟังก์ชันผูกบัญชี (Mapping LINE ID <-> Employee ID)
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !employeeId) return;

    setRegistering(true);
    try {
      // 1. เช็คว่ามีรหัสพนักงานนี้ในระบบจริงไหม
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("employee_id", employeeId)
        .single();

      if (fetchError || !existingUser) {
        alert("❌ ไม่พบรหัสพนักงานนี้ในระบบ หรืออาจเกิดข้อผิดพลาด");
        return;
      }

      // 2. อัปเดต line_user_id ให้ User คนนั้น
      const { error: updateError } = await supabase
        .from("users")
        .update({ line_user_id: userId })
        .eq("id", existingUser.id);

      if (updateError) throw updateError;

      alert(
        `✅ ยินดีต้อนรับคุณ ${existingUser.full_name} เชื่อมต่อบัญชีสำเร็จ!`,
      );
      await refreshUser(); // โหลดข้อมูลใหม่เพื่อให้หน้าเว็บเปลี่ยนสถานะ
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี");
    } finally {
      setRegistering(false);
    }
  }

  // Loading State (รอ LIFF โหลด)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 mb-6">กำลังเชื่อมต่อ LINE...</p>
        <button
          onClick={login}
          className="bg-[#06C755] text-white px-6 py-3 rounded-xl font-bold shadow-lg"
        >
          Login with LINE
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CarFront className="text-blue-600" />
          Car Booking
        </h1>
        {dbUser && (
          <p className="text-gray-500 text-sm mt-1">
            สวัสดี, คุณ{dbUser.full_name} ({dbUser.department})
          </p>
        )}
      </header>

      {/* CASE 1: ยังไม่ผูกบัญชี -> แสดงฟอร์มลงทะเบียน */}
      {!dbUser ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ยืนยันตัวตนพนักงาน
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            กรุณากรอกรหัสพนักงานของคุณเพื่อเริ่มใช้งาน (ครั้งแรกเท่านั้น)
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="รหัสพนักงาน (เช่น EDS1234)"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={registering}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {registering ? "กำลังตรวจสอบ..." : "เข้าใช้งาน"}
            </button>
          </form>
        </div>
      ) : (
        /* CASE 2: ผูกบัญชีแล้ว -> แสดงเมนูหลัก */
        <div className="grid gap-4">
          <Link href="/booking" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-600 transition-colors">
                <CarFront className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">จองรถใช้งาน</h3>
                <p className="text-sm text-gray-500">
                  เลือกดูรถว่างและทำรายการจอง
                </p>
              </div>
            </div>
          </Link>

          <Link href="/my-bookings" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all flex items-center gap-4">
              <div className="bg-orange-100 p-4 rounded-xl group-hover:bg-orange-500 transition-colors">
                <History className="w-8 h-8 text-orange-500 group-hover:text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  รายการของฉัน
                </h3>
                <p className="text-sm text-gray-500">
                  ประวัติการจอง / รับ-คืนรถ
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
