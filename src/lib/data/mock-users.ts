import type { User } from "../types/user";

export const mockUsers: User[] = [
  {
    id: "usr-admin-01",
    fullName: "Nguyễn Văn Quản Trị",
    email: "admin@ergochair.vn",
    phone: "0901234567",
    role: "admin",
    password: "123456",
    addresses: [
      {
        id: "addr-01",
        fullName: "Nguyễn Văn Quản Trị",
        phone: "0901234567",
        province: "Hà Nội",
        district: "Nam Từ Liêm",
        detail: "36 Nguyễn Cơ Thạch, Mỹ Đình 2",
        isDefault: true,
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "usr-customer-01",
    fullName: "Trần Minh Quân",
    email: "quan.tran@example.com",
    phone: "0987654321",
    role: "customer",
    password: "123456",
    addresses: [
      {
        id: "addr-02",
        fullName: "Trần Minh Quân",
        phone: "0987654321",
        province: "TP. Hồ Chí Minh",
        district: "Quận 1",
        detail: "123 Lê Lợi, Bến Nghé",
        isDefault: true,
      },
    ],
    createdAt: "2026-02-15T10:00:00.000Z",
    updatedAt: "2026-03-10T12:00:00.000Z",
  },
];
