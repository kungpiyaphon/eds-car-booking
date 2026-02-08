"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";
import {
  Car,
  Calendar,
  Play,
  StopCircle,
  Gauge,
  Fuel,
  Camera,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // --- State สำหรับ Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"start" | "end">("start");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // --- State สำหรับ Form ใน Modal ---
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState(100); // 0 - 100%
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // User ID ของคุณ (ตรวจสอบแล้วว่าใช้งานได้)
  const MOCK_USER_ID = "0ad487b5-a7b0-4bc5-9aab-00925e74436a";

  // 1. ดึงข้อมูล
  async function fetchMyBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, cars (*)`)
        .eq("user_id", MOCK_USER_ID)
        .order("created_at", { ascending: false });

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

  // 2. เปิด Modal
  function openModal(booking: Booking, type: "start" | "end") {
    setSelectedBooking(booking);
    setModalType(type);
    setMileage(""); // เคลียร์ค่าเดิม
    setFuelLevel(100);
    setImageFile(null);
    setIsModalOpen(true);
  }

  // ฟังก์ชันช่วยอัปโหลดรูปภาพ
  async function uploadImage(
    file: File,
    bookingId: string,
    type: "start" | "end",
  ): Promise<string | null> {
    try {
      // 1. สร้างชื่อไฟล์ไม่ซ้ำกัน: bookingID_type_timestamp.ext
      const fileExt = file.name.split(".").pop();
      const fileName = `${bookingId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. อัปโหลด
      const { error: uploadError } = await supabase.storage
        .from("trip_images") // ชื่อ Bucket ที่เราสร้าง
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. ขอ Public URL
      const { data } = supabase.storage
        .from("trip_images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload Error:", error);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
      return null;
    }
  }

  // 3. จัดการ Submit (รวม Start และ End)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooking || !mileage) return;

    setSubmitting(true);

    try {
      // Step 1: อัปโหลดรูป (ถ้ามี)
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, selectedBooking.id, modalType);
        if (!imageUrl) throw new Error("Image upload failed");
      }

      if (modalType === "start") {
        // --- Logic เริ่มเดินทาง ---
        const { error: logError } = await supabase.from("trip_logs").insert({
          booking_id: selectedBooking.id,
          start_mileage: parseInt(mileage),
          start_fuel_level: fuelLevel,
          start_image_url: imageUrl, // เก็บ URL จริงๆ
        });
        if (logError) throw logError;

        await supabase
          .from("bookings")
          .update({ status: "in_use" })
          .eq("id", selectedBooking.id);
        await supabase
          .from("cars")
          .update({ status: "in_use" })
          .eq("id", selectedBooking.car_id);

        alert("✅ เริ่มการเดินทางเรียบร้อย!");
      } else {
        // --- Logic จบการเดินทาง ---
        const { error: logError } = await supabase
          .from("trip_logs")
          .update({
            end_mileage: parseInt(mileage),
            end_fuel_level: fuelLevel,
            end_image_url: imageUrl, // เก็บ URL จริงๆ
            end_time: new Date().toISOString(),
          })
          .eq("booking_id", selectedBooking.id);

        if (logError) throw logError;

        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .eq("id", selectedBooking.id);
        await supabase
          .from("cars")
          .update({ status: "available" })
          .eq("id", selectedBooking.car_id);

        alert("🎉 คืนรถเรียบร้อย ขอบคุณครับ!");
      }

      setIsModalOpen(false);
      fetchMyBookings();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      {/* Header */}
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
              {/* Card Header */}
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

              {/* Car Info */}
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

              {/* Action Buttons */}
              {booking.status === "approved" && (
                <button
                  onClick={() => openModal(booking, "start")}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all text-lg"
                >
                  <Play className="w-6 h-6 fill-current" /> รับรถ / เริ่มงาน
                </button>
              )}

              {booking.status === "in_use" && (
                <button
                  onClick={() => openModal(booking, "end")}
                  className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all text-lg"
                >
                  <StopCircle className="w-6 h-6 fill-current" /> คืนรถ / จบงาน
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* --- MODAL (หน้าต่างเด้ง) --- */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                {modalType === "start" ? (
                  <Play className="text-blue-600 w-6 h-6" />
                ) : (
                  <StopCircle className="text-orange-500 w-6 h-6" />
                )}
                {modalType === "start" ? "บันทึกการรับรถ" : "บันทึกการคืนรถ"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. เลขไมล์ */}
              <div>
                <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-gray-700" /> เลขไมล์ (กิโลเมตร)
                </label>
                <input
                  type="number"
                  required
                  placeholder="ระบุเลขไมล์หน้าปัดรถ"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-xl font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-gray-400"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>

              {/* 2. ระดับน้ำมัน (Slider) */}
              <div>
                <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-gray-700" /> ระดับน้ำมัน (
                  {fuelLevel}%)
                </label>
                <div className="px-1 py-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-sm font-medium text-gray-500 mt-2">
                    <span className="text-red-500">E (หมด)</span>
                    <span>50%</span>
                    <span className="text-green-600">F (เต็ม)</span>
                  </div>
                </div>
              </div>

              {/* 3. รูปถ่าย (File Input) */}
              <div>
                <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-gray-700" /> ถ่ายรูปหน้าปัด/รถ
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment" // บังคับเปิดกล้องบนมือถือ
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile ? (
                    <div className="text-green-700 font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="w-6 h-6" /> {imageFile.name}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                      <span className="text-base font-medium text-gray-600">
                        แตะเพื่อถ่ายรูป
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-bold text-white text-xl shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2
                  ${
                    modalType === "start"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                      : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                  }
                  ${submitting ? "opacity-70 cursor-wait" : ""}
                `}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" /> กำลังอัปโหลด...
                  </>
                ) : (
                  "ยืนยันข้อมูล"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
