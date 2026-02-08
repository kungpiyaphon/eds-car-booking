"use client"; // ใช้ Client Component เพื่อความง่ายในการ Test เบื้องต้น

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Car } from "@/types";
import { CarFront, Loader2 } from "lucide-react";

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  async function fetchCars() {
    try {
      setLoading(true);
      // คำสั่ง SQL: SELECT * FROM cars ORDER BY created_at DESC
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setCars(data as Car[]);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CarFront className="w-8 h-8 text-blue-600" />
          ระบบจองรถ (Car Booking)
        </h1>

        {/* สถานะ Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" /> กำลังโหลดข้อมูลรถ...
          </div>
        )}

        {/* สถานะ Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-200">
            Error: {error}
          </div>
        )}

        {/* แสดงรายการรถ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!loading && cars.length === 0 && <p>ไม่พบข้อมูลรถในระบบ</p>}

          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {car.brand} {car.model}
                  </h2>
                  <p className="text-gray-500 font-mono text-sm mt-1">
                    ทะเบียน: {car.plate_number}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    car.status === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {car.status === "available" ? "ว่าง" : car.status}
                </span>
              </div>

              <div className="mt-4 flex gap-4 text-sm text-gray-600">
                <div>
                  <span className="block text-xs text-gray-400">ที่นั่ง</span>
                  {car.seat_capacity} ที่นั่ง
                </div>
                <div>
                  <span className="block text-xs text-gray-400">
                    เลขไมล์ปัจจุบัน
                  </span>
                  {car.current_mileage.toLocaleString()} กม.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
