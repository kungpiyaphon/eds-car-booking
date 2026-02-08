// กำหนดหน้าตาข้อมูลให้ตรงกับตารางใน Database

export type Car = {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  seat_capacity: number;
  current_mileage: number;
  image_url: string | null;
  status: 'available' | 'maintenance' | 'in_use';
  created_at: string;
};

export type User = {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'user' | 'admin' | 'approver';
  line_user_id: string | null;
};

// เดี๋ยวเราจะมาเพิ่ม Booking Type ทีหลังเมื่อถึงขั้นตอนนั้น