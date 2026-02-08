"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";
import {
  Play,
  StopCircle,
  Gauge,
  Fuel,
  Camera,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  type: "start" | "end";
  onSuccess: () => void; // ฟังก์ชันเรียกเมื่อทำรายการสำเร็จ (เพื่อรีโหลดข้อมูลหน้าหลัก)
}

export default function TripModal({
  isOpen,
  onClose,
  booking,
  type,
  onSuccess,
}: TripModalProps) {
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState(100);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${booking!.id}_${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("trip_images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("trip_images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload Error:", error);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !mileage) return;

    setSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) throw new Error("Image upload failed");
      }

      if (type === "start") {
        // Start Trip Logic
        const { error } = await supabase.from("trip_logs").insert({
          booking_id: booking.id,
          start_mileage: parseInt(mileage),
          start_fuel_level: fuelLevel,
          start_image_url: imageUrl,
        });
        if (error) throw error;

        await supabase
          .from("bookings")
          .update({ status: "in_use" })
          .eq("id", booking.id);
        await supabase
          .from("cars")
          .update({ status: "in_use" })
          .eq("id", booking.car_id);

        alert("✅ เริ่มการเดินทางเรียบร้อย!");
      } else {
        // End Trip Logic
        const { error } = await supabase
          .from("trip_logs")
          .update({
            end_mileage: parseInt(mileage),
            end_fuel_level: fuelLevel,
            end_image_url: imageUrl,
            end_time: new Date().toISOString(),
          })
          .eq("booking_id", booking.id);
        if (error) throw error;

        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .eq("id", booking.id);
        await supabase
          .from("cars")
          .update({ status: "available" })
          .eq("id", booking.car_id);

        alert("🎉 คืนรถเรียบร้อย ขอบคุณครับ!");
      }

      // Reset Form & Close
      setMileage("");
      setFuelLevel(100);
      setImageFile(null);
      onSuccess(); // แจ้งหน้าหลักให้โหลดข้อมูลใหม่
      onClose();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            {type === "start" ? (
              <Play className="text-blue-600 w-6 h-6" />
            ) : (
              <StopCircle className="text-orange-500 w-6 h-6" />
            )}
            {type === "start" ? "บันทึกการรับรถ" : "บันทึกการคืนรถ"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mileage Input */}
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

          {/* Fuel Slider */}
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

          {/* Camera Input */}
          <div>
            <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-700" /> ถ่ายรูปหน้าปัด/รถ
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
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
              ${type === "start" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"}
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
  );
}
