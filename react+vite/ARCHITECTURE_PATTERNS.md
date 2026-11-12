# Modern React Architecture & Design Patterns (From Flutter / Hexagonal Perspective)

> **Tài liệu tham chiếu chuyên sâu**: Dành cho kỹ sư chuyển đổi từ **Flutter (Clean Architecture / Hexagonal / BLoC)** sang **Modern React (React 18 & 19 + Vite)**.  
> **Trọng tâm**: Bản đồ ánh xạ 1-1 giữa các tầng trách nhiệm, cấu trúc thư mục Feature-Driven, và mẫu thiết kế Smart Hook + Dumb Component.  
> **Liên kết nội bộ**: [CHECKLIST](./CHECKLIST.md) | [README](./README.md)

---

## 1. Sự Khác Biệt Cốt Lõi Về Triết Lý Kiến Trúc

| Tiêu chí | Flutter (Clean Architecture / Hexagonal) | Modern React (React 18/19 + Vite) |
| :--- | :--- | :--- |
| **Mô hình lập trình (Paradigm)** | Hướng đối tượng mạnh mẽ (OOP), Class-based, Dependency Injection (`get_it`, `injectable`). | **Lập trình Hàm (Functional)**, Pure Functions, Component Composition. |
| **Đơn vị đóng gói logic** | Lớp `UseCase` (Nghiệp vụ) và lớp `BLoC / Cubit` (Quản lý State). | **Custom Hooks** (`use...`) tích hợp cả Use Case và State Lifecycle. |
| **Mô hình giao diện (UI)** | Widget Tree được rebuild qua `BlocBuilder` / `Consumer`. | $UI = f(State)$ — Hàm component re-render tự động khi State đổi. |
| **Tính đa hình & Hợp đồng** | Abstract Class & Interface kế thừa (`implements`). | **TypeScript Types, Union Types, và Function Signatures**. |
| **Cảnh báo lỗi kiến trúc** | Cố ép code thủ công không theo layer. | **Over-engineering**: Bê nguyên xi Class, DI Container và Repository OOP vào React. |

---

## 2. Bản Đồ Đối Chiếu 1-1: Từ Flutter Hexagonal Sang Modern React

```text
📁 Flutter (Hexagonal / Clean Arch + BLoC)      📁 React Hiện Đại (Feature-Driven + Hooks)
─────────────────────────────────────────      ─────────────────────────────────────────
├── entities / models/                         ├── types/
│   └── order_model.dart                       │   └── order.types.ts       <-- Data Contracts / Entities
├── data_sources / repositories/               ├── api/
│   └── order_api_service.dart                 │   └── getOrders.ts         <-- Pure Async HTTP Adapters
├── domain / usecases/                         │
│   └── get_orders_usecase.dart                │
├── bloc / state_management/                   ├── hooks/
│   ├── order_bloc.dart                        │   └── useOrders.ts         <-- GỘP USE CASE + BLOC VÀO ĐÂY!
│   ├── order_event.dart                       │
│   └── order_state.dart                       │
└── presentation / widgets/                    ├── components/
    ├── order_item_widget.dart                 │   └── OrderCard.tsx        <-- Dumb Component (Pure JSX)
    └── order_page.dart                        │   └── OrderList.tsx        <-- Smart Container (Ghép nối)
                                               └── index.ts                 <-- Public Port của Feature
```

---

## 3. Kiến Trúc Chuẩn Mực Trong React Hiện Đại

### 3.1 Feature-Driven Architecture (Feature-Sliced Design Lite)
Toàn bộ mã nguồn ứng dụng được tổ chức xoay quanh **Domain nghiệp vụ** (Feature) thay vì gom theo loại kỹ thuật. Mỗi Feature hoạt động như một module đóng gói độc lập:

```text
src/
├── assets/                     # Ảnh tĩnh, icon, font dùng chung
├── components/                 # Các UI component nguyên tử toàn cục (Button, Modal, Input...)
├── config/                     # Biến môi trường, hằng số
├── lib/                        # Client cấu hình bên thứ ba (axios, queryClient...)
├── routes/                     # Cấu hình Router trang (React Router)
├── types/                      # Các TypeScript types chung toàn hệ thống
│
└── features/                   # TẤT CẢ CÁC DOMAIN NGHIỆP VỤ NẰM Ở ĐÂY
    ├── auth/                   # Feature Xác thực
    └── orders/                 # Feature Đơn hàng (Domain Module)
        ├── api/                # [Adapters]: Gọi HTTP API thuần túy (fetch / axios)
        ├── components/         # [Presentation]: Dumb & Smart Components của riêng đơn hàng
        ├── hooks/              # [Use Cases & BLoC]: Custom Hooks điều phối dữ liệu & state
        ├── types/              # [Domain Entities]: Kiểu dữ liệu nội bộ đơn hàng
        └── index.ts            # [Public Port]: Điểm xuất khẩu duy nhất ra bên ngoài
```

> [!IMPORTANT]
> **Quy Tắc Đóng Gói (Public Port)**: Tệp `index.ts` chỉ export những component hoặc hook mà các feature khác hoặc router được phép dùng. Những file nằm trong `api/`, `components/` là private nội bộ.

---

### 3.2 Pattern Smart Hook + Dumb Component (Tiến Hóa Của Container/Presenter)
- **Dumb Component (Thành phần hiển thị thuần túy)**:
  - Chỉ nhận dữ liệu và hàm phản hồi (callback) qua `props`.
  - Không tự gọi API, không nắm giữ business logic phức tạp.
  - Là một hàm thuần khiết (Pure Function): Cùng props $\rightarrow$ Cùng JSX.
- **Smart Hook (Custom Hook đóng vai trò Use Case & BLoC)**:
  - Quản lý vòng đời dữ liệu, gọi API qua tầng `api/`.
  - Chịu trách nhiệm lưu trữ State, xử lý validation và các hành động (Actions).
  - Trả về đối tượng gồm `{ state, actions }` cho Component sử dụng.

---

### 3.3 Mẫu Quản Lý Trạng Thái Discriminated Union (Thay Thế Boolean Hell)
Trong Flutter, bạn có các lớp State riêng biệt: `OrderLoading`, `OrderSuccess(data)`, `OrderError(message)`.  
Trong React, **tuyệt đối không dùng nhiều cờ boolean rời rạc** (`isLoading`, `isError`, `isSuccess`), mà hãy sử dụng **Discriminated Union**:

```typescript
// Chuẩn mực an toàn kiểu (Type-safe State Machine)
export type OrdersState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; orders: Order[] };
```

---

## 4. Code Mẫu Thực Chiến Hoàn Chỉnh Một Feature (`orders`)

Dưới đây là mã nguồn cụ thể cho từng tệp theo cấu trúc chuẩn:

### 1. `features/orders/types/order.types.ts` (Domain Entity)
```typescript
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  items: OrderItem[];
}
```

---

### 2. `features/orders/api/getOrders.ts` (HTTP Adapter / Data Source)
```typescript
import { Order } from '../types/order.types';

// Hàm thuần túy, độc lập 100% với React
export const fetchOrdersApi = async (): Promise<Order[]> => {
  const response = await fetch('/api/v1/orders');
  if (!response.ok) {
    throw new Error('Không thể tải danh sách đơn hàng từ máy chủ');
  }
  return response.json();
};
```

---

### 3. `features/orders/hooks/useOrders.ts` (UseCase + BLoC State Management)
```typescript
import { useState, useEffect } from 'react';
import { Order } from '../types/order.types';
import { fetchOrdersApi } from '../api/getOrders';

export type OrdersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; orders: Order[] };

export const useOrders = () => {
  const [state, setState] = useState<OrdersState>({ status: 'loading' });

  const loadOrders = async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetchOrdersApi();
      setState({ status: 'success', orders: data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setState({ status: 'error', message });
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Dispatch Action (Tương đương event trong BLoC)
  const cancelOrder = async (orderId: string) => {
    console.log(`[ACTION] Hủy đơn hàng: ${orderId}`);
    // Giả lập cập nhật state cục bộ sau khi hủy
    setState((prevState) => {
      if (prevState.status !== 'success') return prevState;
      return {
        ...prevState,
        orders: prevState.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' } : o
        ),
      };
    });
  };

  return { state, reload: loadOrders, cancelOrder };
};
```

---

### 4. `features/orders/components/OrderCard.tsx` (Dumb Component)
```tsx
import React from 'react';
import { Order } from '../types/order.types';

interface OrderCardProps {
  order: Order;
  onCancel: (id: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel }) => {
  const isPending = order.status === 'pending';

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm flex justify-between items-center">
      <div>
        <h4 className="font-bold text-gray-800">Đơn hàng #{order.id}</h4>
        <p className="text-xs text-gray-500">Ngày tạo: {order.createdAt}</p>
        <p className="text-sm font-semibold text-blue-600 mt-1">
          {order.totalAmount.toLocaleString('vi-VN')} đ
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
          {order.status.toUpperCase()}
        </span>

        {isPending && (
          <button
            onClick={() => onCancel(order.id)}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition"
          >
            Hủy đơn
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### 5. `features/orders/components/OrderList.tsx` (Smart Container)
```tsx
import React from 'react';
import { useOrders } from '../hooks/useOrders';
import { OrderCard } from './OrderCard';

export const OrderList: React.FC = () => {
  const { state, reload, cancelOrder } = useOrders();

  // Pattern matching tương đương BlocBuilder
  if (state.status === 'loading') {
    return <div className="p-8 text-center text-gray-400">Đang tải dữ liệu đơn hàng...</div>;
  }

  if (state.status === 'error') {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-xl text-center">
        <p className="text-red-600 text-sm font-medium">⚠️ {state.message}</p>
        <button
          onClick={reload}
          className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào.</p>
      ) : (
        state.orders.map((order) => (
          <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
        ))
      )}
    </div>
  );
};
```

---

### 6. `features/orders/index.ts` (Public Port)
```typescript
// Chỉ xuất khẩu những gì cho phép bên ngoài truy cập
export { OrderList } from './components/OrderList';
export { useOrders } from './hooks/useOrders';
export type { Order } from './types/order.types';
```

---

## 5. Sơ Đồ Kiến Trúc Luồng Hoạt Động (Architecture Flow Diagram)

```mermaid
flowchart TD
    subgraph DataLayer["1. Tầng Adapter / Data Source (api/)"]
        API["getOrders.ts<br/>(Pure fetch / Axios call)"]
    end

    subgraph LogicLayer["2. Tầng Nghiệp Vụ & State (hooks/) - [UseCase & BLoC]"]
        HOOK["useOrders.ts<br/>- Quản lý Discriminated Union State<br/>- Gọi API<br/>- Cung cấp hàm cancelOrder()"]
    end

    subgraph ViewLayer["3. Tầng Hiển Thị (components/) - [Presentation]"]
        CONTAINER["OrderList.tsx (Smart Container)<br/>- Gọi useOrders()<br/>- Phân nhánh State (Loading/Error/Success)"]
        DUMB["OrderCard.tsx (Dumb Component)<br/>- Chỉ nhận Props & Callback<br/>- Pure JSX"]
    end

    API -->|Dữ liệu API thô| HOOK
    HOOK -->|State & Callbacks| CONTAINER
    CONTAINER -->|order, onCancel| DUMB
    DUMB -.->|Kích hoạt onCancel(id)| HOOK
```

---

## 6. Hướng Dẫn Tách Component Trong React

| Tiêu chí | Khi nào nên tách? | Lợi ích đạt được |
| :--- | :--- | :--- |
| **Cô lập Re-render** | Khi một phần UI cập nhật liên tục (input gõ chữ, đồng hồ đếm ngược) nằm chung với một danh sách lớn. | Tránh re-render toàn bộ cây giao diện cha. |
| **Đơn nhiệm (Single Responsibility)** | Khi một component vừa làm layout lớn, vừa lo định dạng chi tiết từng dòng. | Code dễ bảo trì, dễ viết unit test. |
| **Độ dài mã nguồn (Rule of Thumb)** | JSX dài quá **100 – 150 dòng** hoặc lồng thẻ sâu quá **3 – 4 tầng**. | Trực quan, dễ đọc, tránh "mì spaghetti". |
| **Tái sử dụng (Reusability)** | Khi cùng một mẫu hiển thị xuất hiện ở 2 nơi trở lên (ví dụ: Card, Button, Badge). | DRY (Don't Repeat Yourself). |

---

## 📚 Nguồn Tài Liệu Chính Thống (Tier-1 References)
- [React Learn: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) - Hướng dẫn chính thức về việc dùng Custom Hook làm tầng nghiệp vụ tái sử dụng.
- [React Learn: Thinking in React](https://react.dev/learn/thinking-in-react) - Mô hình phân rã cây component và luồng dữ liệu một chiều.
- [Bulletproof React Architecture Guide](https://github.com/alan2207/bulletproof-react) - Bản thiết kế kiến trúc ứng dụng React thực chiến hướng Feature chuẩn hóa.
