"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Car } from "@/types";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/LiffProvider"; // ✅ 1. เรียกใช้ LIFF Provider
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function BookingPage() {
  const router = useRouter();
  const { dbUser, isLoggedIn } = useLiff(); // ✅ 2. ดึงข้อมูล User จริงออกมา

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");

  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // เช็คว่า User Login หรือยัง
  useEffect(() => {
    if (isLoggedIn && !dbUser) {
      // ถ้า Login LINE แล้ว แต่ไม่มีข้อมูลใน DB (ยังไม่ลงทะเบียน) ให้กลับหน้าแรก
      router.push("/");
    }
  }, [isLoggedIn, dbUser, router]);

  useEffect(() => {
    async function checkAvailability() {
      if (!startTime || !endTime) return;
      if (new Date(startTime) >= new Date(endTime)) {
        setError("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
        setAvailableCars([]);
        return;
      }

      setLoading(true);
      setError(null);
      setSelectedCar(null);

      try {
        const { data, error } = await supabase.rpc("get_available_cars", {
          search_start: new Date(startTime).toISOString(),
          search_end: new Date(endTime).toISOString(),
        });

        if (error) throw error;
        setAvailableCars(data as Car[]);
      } catch (err: unknown) {
        console.error(err);
        setError("ไม่สามารถตรวจสอบสถานะรถได้");
      } finally {
        setLoading(false);
      }
    }

    checkAvailability();
  }, [startTime, endTime]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCar || !startTime || !endTime) return;

    // ✅ ป้องกันกรณี User ยังโหลดไม่เสร็จ
    if (!dbUser) {
      alert("กรุณารอสักครู่ กำลังโหลดข้อมูลผู้ใช้...");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ 3. ใช้ dbUser.id ของจริงแทน Mock ID
      const { error } = await supabase.from("bookings").insert({
        car_id: selectedCar,
        user_id: dbUser.id, // <--- ตรงนี้คือจุดเปลี่ยนสำคัญ!
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        purpose,
        destination,
        status: "pending",
      });

      if (error) throw error;

      alert("✅ จองรถสำเร็จ! กรุณารอการอนุมัติ");
      router.push("/my-bookings"); // จองเสร็จไปดูรายการของฉันเลย
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการจอง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Loading State ถ้ายังไม่มี User
  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <Calendar className="text-blue-600 w-8 h-8" /> จองรถใช้งาน
        </h1>

        {/* แสดงชื่อคนจองหน่อย เพื่อความชัวร์ */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          ผู้จอง: <strong>{dbUser.full_name}</strong> ({dbUser.department})
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (ส่วน Form เลือกเวลา เหมือนเดิมเป๊ะ ไม่ต้องแก้) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                เวลาเริ่มต้น
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="datetime-local"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                เวลาสิ้นสุด
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="datetime-local"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {startTime && endTime && !error && (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-base font-semibold text-gray-800 mb-3">
                เลือกรถที่ว่าง ({availableCars.length} คัน)
              </label>

              {loading ? (
                <p className="text-sm text-blue-600 animate-pulse flex items-center gap-2">
                  กำลังตรวจสอบตารางรถ...
                </p>
              ) : availableCars.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {availableCars.map((car) => (
                    <div
                      key={car.id}
                      onClick={() => setSelectedCar(car.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all flex justify-between items-center group ${
                        selectedCar === car.id
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500 shadow-sm"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          ทะเบียน: {car.plate_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {car.seat_capacity} ที่นั่ง • ไมล์{" "}
                          {car.current_mileage.toLocaleString()}
                        </p>
                      </div>
                      {selectedCar === car.id && (
                        <CheckCircle className="text-blue-600 w-6 h-6" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-100 rounded-lg text-gray-600 border border-gray-200 border-dashed">
                  ❌ ไม่พบรถว่างในช่วงเวลานี้
                </div>
              )}
            </div>
          )}

          {selectedCar && (
            <div className="border-t border-gray-200 pt-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  เหตุผลการใช้งาน
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น ไปพบลูกค้า, ไปธนาคาร"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  สถานที่ไป (Destination)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="ระบุสถานที่ปลายทาง"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                {submitting ? "⏳ กำลังบันทึกข้อมูล..." : "ยืนยันการจองรถ"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
