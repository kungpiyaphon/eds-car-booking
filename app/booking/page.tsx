"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Car } from "@/types";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function BookingPage() {
  const router = useRouter();

  // State สำหรับ Form
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");

  // State สำหรับการทำงาน
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UseEffect: ทำงานเมื่อ startTime หรือ endTime เปลี่ยนแปลง
  useEffect(() => {
    async function checkAvailability() {
      if (!startTime || !endTime) return;

      // ตรวจสอบว่าเวลาถูกต้อง (จบต้องหลังเริ่ม)
      if (new Date(startTime) >= new Date(endTime)) {
        setError("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
        setAvailableCars([]);
        return;
      }

      setLoading(true);
      setError(null);
      setSelectedCar(null);

      try {
        // เรียกใช้ฟังก์ชัน RPC: get_available_cars
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
  }, [startTime, endTime]); // Dependency ครบถ้วนแล้ว

  // ฟังก์ชันบันทึกการจอง
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCar || !startTime || !endTime) return;

    setSubmitting(true);
    try {
      // TODO: เปลี่ยนเป็น User ID จริงจาก Auth Context ในอนาคต
      // ใช้ ID ที่คุณสร้างใน Table users
      const MOCK_USER_ID = "e82b7c6a-6534-4b91-8d2a-8c3b9b9c9c9c"; // <-- เปลี่ยนตรงนี้ให้ตรงกับ UUID ของคุณ

      const { error } = await supabase.from("bookings").insert({
        car_id: selectedCar,
        user_id: MOCK_USER_ID,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        purpose,
        destination,
        status: "pending",
      });

      if (error) throw error;

      alert("จองรถสำเร็จ! กรุณารอการอนุมัติ");
      router.push("/");
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <Calendar className="text-blue-600 w-8 h-8" /> จองรถใช้งาน
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ส่วนที่ 1: เลือกเวลา */}
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {/* ส่วนที่ 2: เลือกรถ */}
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

          {/* ส่วนที่ 3: รายละเอียดการเดินทาง */}
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
