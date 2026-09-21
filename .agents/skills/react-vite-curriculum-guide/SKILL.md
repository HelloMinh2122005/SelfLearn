---
name: react-vite-curriculum-guide
description: >-
  Use this skill when teaching, explaining, designing lessons, or providing theoretical and practical guidance for Frontend development with React and Vite. Covers modern React (React 18 & 19), Vite build tooling, Component Mental Model, Hooks, Rendering lifecycle, State Management, and SPAs.
---

# React + Vite Curriculum Guide Skill

This skill provides a structured framework for teaching and learning modern Frontend Web Development focusing on **React** (React 18 & 19) and **Vite**, tightly aligned with official documentation from `react.dev`, `vite.dev`, and MDN Web Docs.

---

## 1. When to Use This Skill
- The user asks to learn, review, or understand any topic related to React or Vite.
- Structuring notes, study tracks, or lesson modules under the `react+vite/` directory.
- Providing deep theoretical explanations of modern web concepts (Virtual DOM, Fiber Reconciler, Native ESM, HMR, Hooks, State lifecycle).
- Providing clean, idiomatic TypeScript / ESNext code snippets accompanied by clear explanations.
- Enriching lessons with official diagrams (Mermaid) and verified public illustrations from `react.dev` and `vite.dev`.

---

## 2. Core Learning Domains & Official Mapping

### Domain 1: Vite & Modern Web Tooling
- **Project Scaffolding & Workflow**: Creating new projects with `npm create vite@latest <app> -- --template react-ts` (or `pnpm`/`bun`), template choices (`react`, `react-ts`, `react-swc-ts`). Essential runtime scripts (`dev`, `build`, `preview`).
- **Project Anatomy**: Why `index.html` resides at the project root as the source entry point (unlike Webpack/CRA), `src/main.tsx` mounting to `#root` via React 18/19 `createRoot`.
- **Native ESM vs Bundler-based Dev Servers**: How traditional bundlers (Webpack) bundle the whole app vs how Vite serves source code over native ESM on demand.
- **Vite Architecture**:
  - Dev Server: Ultra-fast cold start using native ES modules and pre-bundling dependencies with `esbuild` (written in Go).
  - Production Build: Highly optimized bundling using `Rollup` with tree-shaking, code-splitting, and CSS code-splitting.
- **HMR (Hot Module Replacement)**: Instant updates over WebSocket without losing application state or reloading the entire page.
- **Vite Configuration**: `vite.config.ts`, plugins (`@vitejs/plugin-react`), path aliases (`@/`), environment variables (`import.meta.env.VITE_*`), proxy settings.
- *Official Reference*: `https://vite.dev/guide/`

### Domain 2: React Core & Component Mental Model
- **Declarative UI vs Imperative UI**: Shifting mindset from manually mutating the DOM (jQuery/Vanilla JS) to declaring UI as a pure function of State (`UI = f(State)`).
- **JSX / TSX Deep Dive**: JSX as syntactic sugar for `React.createElement` / JSX runtime transforms; rules of JSX (single parent element, camelCase props, closing tags).
- **Component Architecture & Composition**: Container vs Presentational patterns, passing JSX via `children` prop, slots pattern, component hierarchy.
- **Purity in Components**: Keeping components pure (same inputs `props` + `state` -> same output JSX; zero side effects during render phase).
- *Official Reference*: `https://react.dev/learn/describing-the-ui`

### Domain 3: React Lifecycle, Rendering & Fiber Reconciler
- **The 3 Phases of Rendering**:
  1. **Trigger**: Initial render or state update via setter function.
  2. **Render**: React calls component functions to produce Virtual DOM (Fiber tree).
  3. **Commit**: React applies minimal necessary mutations to the real DOM (via ReactDOM).
  4. **Browser Paint**: Browser recalculates layout and paints pixels onto the screen.
- **State as a Snapshot**: Why state variables behave like immutable snapshots of a specific render, and how closures interact with asynchronous updates.
- **Automatic Batching**: How React batches multiple state updates into a single re-render pass (React 18+ automatic batching in promises, timeouts, and native event handlers).
- *Official Reference*: `https://react.dev/learn/render-and-commit`, `https://react.dev/learn/state-as-a-snapshot`

### Domain 4: Modern Hooks & State Management
- **Hooks Philosophy & Rules**: Top-level invocation, only in React function components/custom hooks.
- **Core Hooks**:
  - `useState`: Primitive and object state, updater functions (`setCount(prev => prev + 1)`).
  - `useEffect`: Synchronizing with external systems, cleanup functions, dependency array pitfalls.
  - `useRef`: Persisting mutable values without triggering re-renders; accessing native DOM elements.
  - `useMemo` & `useCallback`: Memoizing computed values and function references; when to use vs premature optimization.
  - `useContext` & Context API: Avoiding prop drilling for global themes/user sessions.
- **React 19 Innovations**:
  - `useActionState`: Handling async transitions, pending state, and optimistic updates.
  - `useOptimistic`: Instant UI updates before server confirmation.
  - `use`: Unwrapping Promises and reading context dynamically inside loops and conditions.
- **State Management Strategies**:
  - Local component state (`useState`, `useReducer`).
  - Global client state (Zustand: minimal, hook-based, external store).
  - Server caching & synchronization (TanStack Query / React Query: stale-while-revalidate, caching, mutation).
- *Official Reference*: `https://react.dev/reference/react`

### Domain 5: Routing & Single Page Application (SPA) Architecture
- **Client-Side Routing**: History API (`pushState`, `popState`), browser URL synchronization without full page reloads.
- **React Router (v6 / v7)**:
  - Route definitions (`createBrowserRouter`, `RouterProvider`, `<Routes>`, `<Route>`).
  - Layouts & Nested Routing (`<Outlet />`).
  - Dynamic route parameters (`useParams`, `useSearchParams`).
  - Data loading (`loader`, `action`, `useLoaderData`, `useNavigation`).
- **Code Splitting & Suspense**: Dynamic imports with `React.lazy()`, `<Suspense fallback={<Loading />}>` for route-level and component-level deferred loading.
- *Official Reference*: `https://reactrouter.com/`

### Domain 6: Performance Optimization & Testing
- **React Profiler**: Identifying slow renders, wasted re-renders, and component commit duration.
- **Memoization & Component Splitting**: `React.memo` for pure components, moving state down to avoid re-rendering heavy parent trees.
- **Vite Performance**: Bundle visualization (`rollup-plugin-visualizer`), vendor chunking, asset optimization.
- **Testing with Vitest**: Unit testing hooks and utilities, component integration testing with `@testing-library/react` and `jsdom`.
- *Official Reference*: `https://react.dev/reference/react/memo`, `https://vitest.dev/`

---

## 3. Teaching & Lesson Presentation Guidelines

When authoring lessons, study notes, or explaining React + Vite concepts:

1. **Bản Chất Kỹ Thuật (Core Concepts & Technical Deep Dive)**:
   - Always explain the *why* and the internal mechanism (e.g., how the Fiber tree reconciles, why closures trap stale state, how Vite leverages HTTP 304 and native ESM).

2. **Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)**:
   - Every theoretical concept must be mapped to a vivid real-world analogy:
     - *Rendering & Commit*: Restaurant model (Customer order = Trigger, Chef preparing dish = Render, Waiter serving to table = Commit, Eating dish = Browser Paint).
     - *State as a Snapshot*: Taking a polaroid photograph; each render sees the fixed photo taken at that exact instant.
     - *Vite vs Traditional Bundler*: A restaurant that cooks a 50-course meal upfront before opening its doors (Bundler) vs a sushi conveyor belt that serves freshly prepared plates on-demand as guests order (Vite Native ESM).
     - *useRef*: A personal sticky note attached to your monitor that you can scribble on without having to reconstruct the entire desk.

3. **Kiến Trúc, Sơ Đồ & Hình Ảnh Minh Họa (Mermaid & Official Public Media)**:
   - Combine clear Mermaid diagrams with verified official public images from `react.dev` CDN and `vite.dev`.
   - Always use the `react-sample-code-guide` catalog for verified image URLs.

4. **Code Mẫu Trực Quan & Chú Thích Rõ Ràng (Clean, Runnable Sample Code)**:
   - Write modern, idiomatic TypeScript / ESNext code.
   - Separate concerns clearly: State setup, Handlers, and JSX return.
   - Include meaningful comments explaining *what happens behind the scenes*.
   - Never use outdated patterns (e.g. class components, legacy lifecycle methods `componentDidMount`, or mixing side effects into render).

5. **📚 Nguồn Tài Liệu Chính Thống (Tier-1 References)**:
   - Always conclude with direct links to `react.dev`, `vite.dev`, or `developer.mozilla.org`.

---

## 4. Hierarchical 3-Tier Curriculum Directory Structure

All courses and modules under `react+vite/` MUST adhere to the standardized 3-tier structure:

```text
react+vite/
├── CHECKLIST.md                     # Comprehensive checklist of frontend skills
├── <N> Domain <N> - <Domain Name>/  # Tier 1: Main Domain Folder
│   ├── <N>_<M> <Topic Name>/        # Tier 2: Topic Group Folder
│   │   ├── <N>_<M>_<P> <Lesson>.md  # Tier 3: Detailed Lesson File
```

### Standard Lesson File Structure (`*.md`):
- **Header & Metadata**: Khóa học, Domain, Topic, Thời lượng dự kiến, Mục tiêu bài học.
- **1. Khái Niệm Cốt Lõi & Bản Chất Kỹ Thuật (Core Technical Deep Dive)**.
- **2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogy)**.
- **3. Sơ Đồ Kiến Trúc & Hình Ảnh Trực Quan (Mermaid & Official Visual Media)**.
- **4. Code Mẫu Trực Quan & Giải Thích Từng Dòng (Sample Code & Step-by-Step Breakdown)**.
- **5. 📚 Nguồn Tài Liệu Chính Thống (Tier-1 Official References)**.
