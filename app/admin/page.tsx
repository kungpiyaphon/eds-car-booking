"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  CarFront,
} from "lucide-react";

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลการจองที่รออนุมัติ (Status = pending)
  async function fetchPendingBookings() {
    try {
      setLoading(true);
      // เทคนิคการ Join Table ของ Supabase: ใช้ select('*, cars(*), users(*)')
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          cars (*),
          users (*)
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }); // คิวแรกมาก่อน

      if (error) throw error;
      setBookings(data as Booking[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("ไม่สามารถดึงข้อมูลรายการจองได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  // 2. ฟังก์ชันอนุมัติ/ไม่อนุมัติ
  async function updateStatus(
    bookingId: string,
    newStatus: "approved" | "rejected",
  ) {
    let comment = "";

    // ถ้าปฏิเสธ ให้ถามเหตุผล
    if (newStatus === "rejected") {
      const reason = window.prompt("กรุณาระบุเหตุผลที่ไม่อนุมัติ:");
      if (reason === null) return; // ถ้ากด Cancel ไม่ต้องทำต่อ
      comment = reason;
    }

    if (
      !confirm(
        `ยืนยันการ ${newStatus === "approved" ? "อนุมัติ" : "ปฏิเสธ"} ใช่หรือไม่?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          approver_comment: comment,
        })
        .eq("id", bookingId);

      if (error) throw error;

      // อัปเดตหน้าจอโดยเอา List ตัวที่เพิ่งทำรายการออกไป
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      alert(`ดำเนินการ ${newStatus} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  }

  // --- ส่วนแสดงผล (UI) ---
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <CheckCircle className="w-10 h-10 text-blue-600" />
          รายการรออนุมัติ (Pending Approvals)
        </h1>

        {loading ? (
          <p className="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-200">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">
              ไม่มีรายการค้าง
            </h3>
            <p className="text-gray-500 mt-2">จัดการคำขอทั้งหมดเรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header: ข้อมูลคนจอง */}
                  <div className="flex justify-between items-start mb-4 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {booking.users?.full_name || "ไม่ระบุชื่อ"}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {booking.users?.department} • รหัส{" "}
                          {booking.users?.employee_id}
                        </p>
                      </div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Waiting
                    </span>
                  </div>

                  {/* Body: รายละเอียดการจอง */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase">
                        ข้อมูลการเดินทาง
                      </h3>
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <span className="font-medium">ไปที่:</span>{" "}
                          {booking.destination}
                          <p className="text-sm text-gray-500 mt-1">
                            เหตุผล: {booking.purpose}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div className="text-sm">
                          <p>
                            เริ่ม:{" "}
                            {new Date(booking.start_time).toLocaleString(
                              "th-TH",
                            )}
                          </p>
                          <p>
                            สิ้นสุด:{" "}
                            {new Date(booking.end_time).toLocaleString("th-TH")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase">
                        รถที่ขอใช้
                      </h3>
                      <div className="flex items-center gap-3">
                        <CarFront className="w-8 h-8 text-gray-600" />
                        <div>
                          <p className="font-bold text-gray-900">
                            {booking.cars?.brand} {booking.cars?.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            ทะเบียน: {booking.cars?.plate_number}
                          </p>
                        </div>
                      </div>
                      {/* Alert ถ้าเวลาซ้อนทับ (ในอนาคตทำเพิ่มได้) */}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <button
                      onClick={() => updateStatus(booking.id, "rejected")}
                      className="px-6 py-2 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" /> ไม่อนุมัติ
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, "approved")}
                      className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-5 h-5" /> อนุมัติ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
