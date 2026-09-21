# 📋 Study Guide & Skills Checklist: Modern Frontend (React + Vite)

> **Lộ trình tự học Frontend Engineering chuẩn hóa với React (18 & 19) và Vite**  
> **Trọng tâm**: Lý thuyết bản chất (Mental Model) + Code mẫu runnable (TypeScript) + Sơ đồ hình ảnh trực quan (Official Media)  
> **Nguồn tài liệu đối chiếu**: [React Docs](https://react.dev/) | [Vite Guide](https://vite.dev/) | [MDN Web Docs](https://developer.mozilla.org/)

---

## 📊 Bảng Theo Dõi Tiến Độ Toàn Bộ 6 Miền Kỹ Năng

| Miền kỹ năng (Domain) | Trọng tâm | Số chủ đề | Tiến độ hoàn thành |
| :--- | :--- | :---: | :---: |
| **Domain 1**: Vite and Modern Web Tooling | Scaffolding, Workflow, Native ESM, HMR, Config | 8 mục | `[ ] 0 / 8` |
| **Domain 2**: React Core and Component Mental Model | Declarative UI, JSX, Composition, Purity | 6 mục | `[ ] 0 / 6` |
| **Domain 3**: Rendering Lifecycle and Fiber Reconciler | Trigger/Render/Commit, State Snapshot, Batching | 6 mục | `[ ] 0 / 6` |
| **Domain 4**: Modern Hooks and State Management | Core Hooks, React 19, Zustand, TanStack Query | 8 mục | `[ ] 0 / 8` |
| **Domain 5**: Routing and Single Page Application (SPA) | React Router v6/v7, Data APIs, Suspense, Lazy | 6 mục | `[ ] 0 / 6` |
| **Domain 6**: Performance Optimization and Testing | Profiler, Re-render Prevention, Vitest, RTL | 6 mục | `[ ] 0 / 6` |
| **TỔNG CỘNG** | **Frontend React + Vite Core Track** | **40 mục** | **`0%`** |

---

## 🎯 Chi Tiết Từng Miền Kỹ Năng (Skills Checklist)

### 1 Domain 1 - Vite and Modern Web Tooling
#### 1.1 Project Initialization & Workflow
- [ ] **1_1_1 Scaffold and Run a React + Vite Project**: Khởi tạo dự án bằng `npm create vite@latest`, các template (`react`, `react-ts`, `react-swc`), giải nghĩa scripts `dev`, `build`, `preview`.
- [ ] **1_1_2 Project Anatomy and Root index.html**: Giải phẫu cấu trúc thư mục, tại sao `index.html` nằm ở root thay vì `public/`, vai trò của `src/main.tsx` và `createRoot`.
#### 1.2 Vite Architecture & Native ESM
- [ ] **1_2_1 How Vite Uses Native ESM**: So sánh cơ chế On-demand Native ESM của Vite với Bundle-based Server của Webpack.
- [ ] **1_2_2 Dev Server vs Production Build**: Tách biệt vai trò giữa `esbuild` (Go - pre-bundling dependencies) và `Rollup` (tối ưu hóa bundle production).
- [ ] **1_2_3 Hot Module Replacement (HMR)**: Cơ chế cập nhật module qua WebSocket mà không tải lại toàn trang hay mất state.
#### 1.3 Configuration and Asset Handling
- [ ] **1_3_1 Vite Configuration Deep Dive**: Cấu hình `vite.config.ts`, alias `@/`, plugins (`@vitejs/plugin-react`).
- [ ] **1_3_2 Environment Variables**: Sử dụng `import.meta.env`, tiền tố `VITE_` và tệp `.env`.
- [ ] **1_3_3 Static Asset Handling and CSS**: Xử lý hình ảnh, SVG dưới dạng component, CSS Modules và PostCSS.

---

### 2 Domain 2 - React Core and Component Mental Model
#### 2.1 Mental Model Transformation
- [ ] **2_1_1 Declarative UI vs Imperative DOM**: Tư duy `UI = f(State)` so với thao tác DOM thủ công kiểu cũ.
- [ ] **2_1_2 JSX / TSX Under the Hood**: Bản chất JSX Runtime (`_jsx`), cú pháp biểu thức và các quy tắc bắt buộc.
- [ ] **2_1_3 Pure Components**: Khái niệm hàm thuần khiết, tính dự đoán được và quy tắc zero-side-effects trong render.
#### 2.2 Component Architecture & Composition
- [ ] **2_2_1 Component Hierarchy & Props**: Truyền dữ liệu một chiều (Unidirectional data flow) từ cha xuống con.
- [ ] **2_2_2 Children Prop & Slot Pattern**: Kỹ thuật Component Composition linh hoạt, tránh prop drilling nông.
- [ ] **2_2_3 Conditional Rendering & List Keys**: Render theo điều kiện (`&&`, ternary) và ý nghĩa cốt lõi của thuộc tính `key` trong danh sách.

---

### 3 Domain 3 - Rendering Lifecycle and Fiber Reconciler
#### 3.1 The Rendering Pipeline
- [ ] **3_1_1 The 3 Phases (Trigger, Render, Commit)**: Hiểu sâu mô hình nhà hàng (Bồi bàn nhận order -> Đầu bếp nấu ăn -> Bồi bàn bưng đĩa -> Khách ăn/Browser Paint).
- [ ] **3_1_2 Virtual DOM vs Real DOM**: Cấu trúc cây Fiber và thuật toán so khớp (Reconciliation diffing).
- [ ] **3_1_3 Browser Paint & Layout Shift**: Sự tách biệt giữa DOM mutations và thời điểm trình duyệt vẽ điểm ảnh.
#### 3.2 State Mechanics
- [ ] **3_2_1 State as a Snapshot**: Tại sao biến state bất biến trong mỗi lượt render và cách tương tác với JS Closures.
- [ ] **3_2_2 Automatic Batching**: Cơ chế gom nhóm nhiều thay đổi state thành một lượt render duy nhất trong React 18+.
- [ ] **3_2_3 Queueing a Series of State Updates**: Sử dụng updater function (`setCount(prev => prev + 1)`).

---

### 4 Domain 4 - Modern Hooks and State Management
#### 4.1 Core React Hooks
- [ ] **4_1_1 useState Deep Dive**: Quản lý kiểu dữ liệu nguyên thủy và object, tối ưu hàm khởi tạo lười (`useState(() => init())`).
- [ ] **4_1_2 useEffect & Synchronization**: Đồng bộ với hệ thống bên ngoài, dependency array, và cách viết hàm cleanup đúng chuẩn.
- [ ] **4_1_3 useRef for Mutable Values & DOM**: Tham chiếu tới node DOM thực tế và lưu trữ giá trị không kích hoạt re-render.
- [ ] **4_1_4 useMemo and useCallback**: Khi nào nên ghi nhớ tính toán/hàm và cái giá của việc lạm dụng memoization.
- [ ] **4_1_5 useContext and Context API**: Tránh prop drilling ở mức toàn cục (Theme, Auth, Language).
#### 4.2 React 19 & State Architectures
- [ ] **4_2_1 React 19 Actions & useActionState**: Quản lý pending state và xử lý form bất đồng bộ không cần boilerplates.
- [ ] **4_2_2 Zustand for Global Client State**: Quản lý store toàn cục gọn nhẹ, không boilerplate, tương thích ngoài React tree.
- [ ] **4_2_3 TanStack Query for Server State**: Stale-while-revalidate, tự động cache, refetching và mutation dữ liệu từ backend.

---

### 5 Domain 5 - Routing and Single Page Application (SPA)
#### 5.1 Client-Side Routing Core
- [ ] **5_1_1 HTML5 History API**: Cơ chế `pushState`, `replaceState` và sự kiện `popstate` đồng bộ URL không reload trang.
- [ ] **5_1_2 React Router v6/v7 Setup**: Cấu hình `createBrowserRouter`, `RouterProvider`, các thẻ `<Link>` và `<NavLink>`.
- [ ] **5_1_3 Nested Routing & Layouts**: Sử dụng `<Outlet />` để chia sẻ UI chung (Navbar, Sidebar) giữa các trang con.
#### 5.2 Dynamic Routes & Code Splitting
- [ ] **5_2_1 Dynamic Route Params**: Trích xuất tham số đường dẫn với `useParams` và query strings với `useSearchParams`.
- [ ] **5_2_2 Data Loaders and Actions**: Tải dữ liệu song song trước khi render với hàm `loader` trong React Router.
- [ ] **5_2_3 Code Splitting with React.lazy & Suspense**: Phân tách bundle theo route, hiển thị giao diện chờ linh hoạt.

---

### 6 Domain 6 - Performance Optimization and Testing
#### 6.1 Performance Engineering
- [ ] **6_1_1 React DevTools Profiler**: Phân tích biểu đồ Flamegraph, nhận diện render chậm và nguyên nhân gây re-render.
- [ ] **6_1_2 Component Optimization Patterns**: Sử dụng `React.memo`, kỹ thuật đưa state xuống dưới (moving state down) hoặc nâng content lên trên (lifting content up).
- [ ] **6_1_3 Vite Bundle Analyzer**: Kiểm tra dung lượng chunks, loại bỏ thư viện thừa (tree-shaking inspection).
#### 6.2 Modern Testing
- [ ] **6_2_1 Vitest Setup**: Cấu hình Vitest chạy trực tiếp trong môi trường Vite không cần chuyển đổi Babel.
- [ ] **6_2_2 Testing Custom Hooks**: Kiểm thử logic hook độc lập với `@testing-library/react`.
- [ ] **6_2_3 Component Integration Testing**: Viết test hành vi người dùng (user events, async rendering) với React Testing Library.

---

## 📚 Nguồn Tài Liệu Chính Thống
- [React Learn Documentation](https://react.dev/learn)
- [Vite Official Guide](https://vite.dev/guide/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Vitest Documentation](https://vitest.dev/)
- [React Router Guide](https://reactrouter.com/)
