"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";
import {
  Car,
  Calendar,
  MapPin,
  Navigation,
  Play,
  StopCircle,
} from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // ID ของคุณ (Mock User ID)
  const MOCK_USER_ID = "0ad487b5-a7b0-4bc5-9aab-00925e74436a";

  // 1. ดึงรายการจองของฉัน
  async function fetchMyBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, cars (*)`) // Join เอาข้อมูลรถมาโชว์ด้วย
        .eq("user_id", MOCK_USER_ID)
        .order("created_at", { ascending: false }); // ใหม่สุดขึ้นก่อน

      if (error) throw error;
      setBookings(data as Booking[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // 2. ฟังก์ชันเริ่มออกเดินทาง (Start Trip)
  async function handleStartTrip(booking: Booking) {
    // ในอนาคตเปลี่ยนเป็น Modal ให้กรอกเลขไมล์
    const startMileage = window.prompt(
      "🚗 กรุณาระบุเลขไมล์เริ่มต้น (Start Mileage):",
    );
    if (!startMileage) return;

    if (!confirm("ยืนยันการรับรถและเริ่มการเดินทาง?")) return;

    try {
      // 2.1 อัปเดตสถานะ Booking เป็น in_use
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "in_use" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // 2.2 อัปเดตสถานะ "รถ" เป็น in_use (ไม่ให้คนอื่นจองซ้อน)
      await supabase
        .from("cars")
        .update({ status: "in_use" })
        .eq("id", booking.car_id);

      alert("✅ เริ่มการเดินทางเรียบร้อย! ขอให้เดินทางโดยสวัสดิภาพ");
      fetchMyBookings(); // รีโหลดข้อมูล
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเริ่มเดินทาง");
    }
  }

  // 3. ฟังก์ชันคืนรถ (End Trip)
  async function handleEndTrip(booking: Booking) {
    const endMileage = window.prompt(
      "🏁 กรุณาระบุเลขไมล์เมื่อถึงจุดหมาย (End Mileage):",
    );
    if (!endMileage) return;

    if (!confirm("ยืนยันการคืนรถและสิ้นสุดการเดินทาง?")) return;

    try {
      // 3.1 อัปเดตสถานะ Booking เป็น completed
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", booking.id);

      if (error) throw error;

      // 3.2 ปลดล็อครถให้ว่าง (available)
      await supabase
        .from("cars")
        .update({ status: "available" })
        .eq("id", booking.car_id);

      alert("🎉 คืนรถเรียบร้อย ขอบคุณครับ");
      fetchMyBookings();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการคืนรถ");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">รายการจองของฉัน</h1>

      {loading ? (
        <div className="text-center text-gray-500 mt-10 animate-pulse">
          กำลังโหลดข้อมูล...
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-gray-400 mt-10 bg-white p-8 rounded-xl border border-dashed border-gray-300">
          <p>คุณยังไม่มีรายการจอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md"
            >
              {/* Header: Status */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
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
                      booking.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.status === "in_use"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                            : booking.status === "completed"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-red-100 text-red-700"
                    }
                `}
                >
                  {booking.status === "in_use"
                    ? "กำลังเดินทาง 🚗"
                    : booking.status === "approved"
                      ? "อนุมัติแล้ว ✅"
                      : booking.status === "pending"
                        ? "รออนุมัติ ⏳"
                        : booking.status === "completed"
                          ? "คืนรถแล้ว 🏁"
                          : "ไม่อนุมัติ"}
                </span>
              </div>

              {/* Car Info */}
              <div className="flex items-start gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {booking.cars?.brand} {booking.cars?.model}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ทะเบียน: {booking.cars?.plate_number}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex gap-2 items-start">
                  <Navigation className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>
                    <span className="font-semibold">ไปที่:</span>{" "}
                    {booking.destination}
                  </span>
                </div>
                <div className="flex gap-2 items-start">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>
                    <span className="font-semibold">เหตุผล:</span>{" "}
                    {booking.purpose}
                  </span>
                </div>
              </div>

              {/* Actions Button */}
              {booking.status === "approved" && (
                <button
                  onClick={() => handleStartTrip(booking)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" /> เริ่มออกเดินทาง
                  (Start Trip)
                </button>
              )}

              {booking.status === "in_use" && (
                <button
                  onClick={() => handleEndTrip(booking)}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 cursor-pointer"
                >
                  <StopCircle className="w-5 h-5 fill-current" /> คืนรถ (End
                  Trip)
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
