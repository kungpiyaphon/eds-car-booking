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

export type Booking = {
  id: string;
  user_id: string;
  car_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approver_comment?: string;
  created_at: string;
};