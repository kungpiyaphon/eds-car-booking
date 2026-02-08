"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";
import { useLiff } from "@/components/LiffProvider";
import TripModal from "@/components/TripModal"; // ✅ Import Component ใหม่
import { Car, Calendar, Play, StopCircle, Loader2 } from "lucide-react";

export default function MyBookingsPage() {
  const { dbUser } = useLiff();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"start" | "end">("start");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // ✅ ใช้ useCallback เพื่อจดจำฟังก์ชันไว้ ไม่ให้สร้างใหม่ทุกครั้งที่ render
  const fetchMyBookings = useCallback(async () => {
    if (!dbUser) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, cars (*)`)
        .eq("user_id", dbUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data as Booking[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dbUser]); // ฟังก์ชันนี้จะเปลี่ยนเมื่อ dbUser เปลี่ยนเท่านั้น

  // เรียกครั้งแรก
  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]); // ✅ ใส่ fetchMyBookings เป็น dependency ได้แล้ว

  // ฟังก์ชันเปิด Modal
  function handleOpenModal(booking: Booking, type: "start" | "end") {
    setSelectedBooking(booking);
    setModalType(type);
    setIsModalOpen(true);
  }

  // UI ส่วน Loading
  if (!dbUser) {
    return (
      <div className="p-10 text-center text-gray-500">กำลังยืนยันตัวตน...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">รายการจองของฉัน</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-600 mt-10 animate-pulse font-medium flex justify-center items-center gap-2">
            <Loader2 className="animate-spin w-5 h-5" /> กำลังโหลดข้อมูล...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">ไม่มีรายการจอง</div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-base">
                    {new Date(booking.start_time).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold
                    ${
                      booking.status === "in_use"
                        ? "bg-blue-600 text-white animate-pulse"
                        : booking.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "completed"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-yellow-100 text-yellow-800"
                    }
                `}
                >
                  {booking.status === "in_use"
                    ? "กำลังใช้งาน"
                    : booking.status === "approved"
                      ? "อนุมัติแล้ว"
                      : booking.status === "completed"
                        ? "สำเร็จ"
                        : booking.status}
                </span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Car className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {booking.cars?.brand} {booking.cars?.model}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    ทะเบียน: {booking.cars?.plate_number}
                  </p>
                </div>
              </div>

              {booking.status === "approved" && (
                <button
                  onClick={() => handleOpenModal(booking, "start")}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all text-lg"
                >
                  <Play className="w-6 h-6 fill-current" /> รับรถ / เริ่มงาน
                </button>
              )}

              {booking.status === "in_use" && (
                <button
                  onClick={() => handleOpenModal(booking, "end")}
                  className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all text-lg"
                >
                  <StopCircle className="w-6 h-6 fill-current" /> คืนรถ / จบงาน
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ✅ เรียกใช้ TripModal ที่แยกออกไป */}
      <TripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
        type={modalType}
        onSuccess={fetchMyBookings} // ส่งฟังก์ชันให้ Modal เรียกเมื่อเสร็จงาน
      />
    </div>
  );
}
