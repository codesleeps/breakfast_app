# Community Breakfast Ordering App

## High-level Strategy and Goal

A community ordering web app for supported-living residents in Birmingham, focused on breakfast service (8am–11am). The app enables residents (or staff on their behalf) to browse today's breakfast menu, place simple orders with delivery or collection, and choose payment method. Kitchen staff get a real-time dashboard to manage and fulfil orders.

**Key design principles:**
- Mobile-first, accessible UI suitable for residents on Android/iOS phones
- Warm, friendly design with amber/orange accents
- Simple ordering flow requiring minimal input
- Real-time kitchen dashboard with auto-refresh
- PWA-ready for "Add to Home Screen" on mobile devices
- Staff-only areas protected by PIN entry
- Configurable service hours and days

## Changes Implemented

### v1 – Core Ordering System
- **Database**: Three tables – `menu_items`, `orders`, `order_items` with proper indexes
- **Seed data**: 13 breakfast menu items across Hot, Light, and Drinks categories
- **API Routes**:
  - `GET /api/menu` – available menu items
  - `POST /api/orders` – create an order with server-side price validation
  - `GET /api/orders` – today's orders with items (supports status filtering)
  - `PATCH /api/orders/[id]/status` – advance order status
- **Home Page (Order Breakfast)**: Menu grouped by category, +/- cart controls, floating cart bar, bottom sheet order form with name/delivery/payment/notes, success confirmation
- **Kitchen Dashboard**: Live clock, tab-based status filtering, order cards with action buttons, auto-refresh every 10s, new order notifications
- **Sidebar navigation**: Links to both pages

### v1.1 – Menu Item Images
- Added appetizing food photos from Unsplash to all 13 menu items
- Updated MenuItemCard layout: image thumbnail on the left with item details on the right
- Responsive sizing (112px on mobile, 128px on larger screens)
- Lazy loading for performance

### v1.2 – Print Orders
- Added "Print Orders" button to Kitchen Dashboard header
- Print-optimized A4 layout with clean tabular format
- Delivery Round summary sorted by flat number with tick-box column
- Orders grouped by status with all details

### v1.3 – PWA Support, Staff PIN Protection & Menu Management
- **PWA Support**: manifest.json, Apple Web App meta tags, standalone display mode
- **Staff PIN Protection**: StaffAuthGate component with 4-digit PIN entry, server-side verification
- **Menu Management Page**: Full CRUD for menu items with table view, add/edit/delete dialogs, availability toggle

### v1.4 – Service Hours, Order Confirmation, Daily Stats, Accessibility & Service Days Config

#### ⏰ Service Hours Enforcement
- Created `kitchen_settings` database table storing `service_days`, `service_start_hour`, `service_end_hour`
- New `GET /api/settings` endpoint returns current kitchen configuration
- New `PATCH /api/settings` endpoint allows staff to update settings (PIN-protected)
- **Client-side**: Friendly "Kitchen is Closed" banner when outside service hours — residents can still browse the menu but can't add items to cart
- **Server-side**: POST /api/orders rejects orders when kitchen is closed with a friendly message
- ServiceStatus component shows real open/closed status based on actual settings
- Auto-rechecks every 30 seconds

#### 🔔 Order Confirmation Details
- Enhanced OrderSuccess component with receipt-style confirmation:
  - Prominent order number in amber highlighted box
  - **Progress tracker** showing Order Received → Preparing → Ready → Delivered with visual step indicators
  - Time placed and estimated wait time (calculated from number of orders ahead, ~5 min per order)
  - Full itemised receipt with delivery method and payment type
  - "What happens next?" explainer section with friendly 3-step guide
- New `GET /api/orders/[id]` endpoint for single order lookup
- `useOrder(id)` hook with 15-second auto-refresh — confirmation page updates live as kitchen progresses the order
- `useOrdersAhead(id)` hook estimates queue position

#### 📊 Daily Summary/Stats
- New `GET /api/orders/stats` endpoint returning:
  - Total orders & revenue, orders by status/delivery/payment method
  - Top 5 popular items by quantity
  - Orders by hour for charting
- Collapsible "📊 Daily Stats" panel on Kitchen Dashboard with:
  - Summary cards: Total Orders, Revenue, Deliveries, Average Order Value
  - **Bar chart** (Recharts/Shadcn) showing orders by hour
  - Popular items ranked list with numbered badges
  - Payment method breakdown with percentage bars

#### ♿ Accessibility Improvements
- **Increased base font size** to 17px in globals.css
- **44px minimum touch targets** via `.touch-target` utility class applied to all buttons (+/-, add to cart, radio options, form submit, status update buttons)
- **aria-labels** on all interactive elements (add/remove buttons include item names and prices)
- **aria-live="polite"** on ServiceStatus and cart bar for screen reader announcements
- **role="status"** on service status badge
- **role="progressbar"** on order progress tracker
- **role="article"** and descriptive aria-labels on order cards in kitchen dashboard
- **role="list"** and **aria-label** on menu sections
- **role="alert"** on error messages
- **Skip to main content** link (visible on keyboard focus) in layout
- **Semantic heading hierarchy** (h1 → h2 → h3)
- **High contrast**: Upgraded amber-700 to amber-800 for better contrast ratios on prices and totals
- **aria-required** on mandatory form fields
- **Larger radio and checkbox targets** (h-5 w-5 with min-h-[48px] rows)

#### 📅 Service Days Config
- **KitchenSettingsPanel** component on the Manage Menu page:
  - 7 toggle buttons for each day (Mon–Sun), amber-highlighted when active
  - Start/end hour dropdowns (6am–12pm range)
  - Current config summary (e.g. "Open Monday–Friday, 8am–11am")
  - Dirty-state tracking — Save button only enabled when changes are made
  - Validation: at least one day required, end must be after start
- Settings are persisted in the `kitchen_settings` database table

### v1.5 – Feedback System
- **New `OrderFeedback` and `FeedbackStats` models** in `src/shared/models/breakfast.ts`
- **Feedback API Routes**:
  - `POST /api/feedback` – submit feedback (rating 1-5, optional comment) for an order. Validates rating, checks order exists, prevents duplicate feedback (409)
  - `GET /api/feedback` – returns today's feedback stats: total count, average rating, rating distribution (1-5), and last 20 feedback entries with resident name and items
  - `GET /api/feedback/[orderId]` – check if feedback exists for a specific order
- **OrderSuccess feedback prompt**: After an order is delivered, a feedback card appears with:
  - 5 clickable star rating (amber filled, 44px touch targets)
  - Optional comment textarea
  - Submit button with loading state
  - Shows "Thank you" with submitted rating if already reviewed
- **Feedback Dashboard** (`/feedback`): Staff-only page behind PIN auth showing:
  - Summary cards: Total Feedback, Average Rating (with stars), 5-Star Reviews, Response Rate
  - Horizontal bar chart for rating distribution (5→1) with amber bars and percentages
  - Recent comments list with resident name, star rating, items ordered, comment, and time
- **Navigation**: Added "Feedback" link with MessageSquare icon to sidebar
- **API Client**: `useFeedbackStats()`, `useOrderFeedback(orderId)`, `submitFeedback()` hooks/functions
- **Tests**: 20 new tests covering all feedback API endpoints (validation, happy paths, edge cases, error handling)

### Component Architecture (v1.4)
Extracted reusable breakfast components into `src/components/breakfast/`:
- `ServiceStatus.tsx` – live open/closed badge using real settings
- `KitchenClosedOverlay.tsx` – friendly closed message with schedule
- `MenuItemCard.tsx` – accessible menu item card with disabled state
- `OrderSuccess.tsx` – enhanced confirmation with progress tracker
- `DailyStats.tsx` – collapsible stats panel with charts
- `KitchenSettingsPanel.tsx` – service days & hours config UI
- `utils.ts` – shared formatters (price, hours, day ranges, kitchen open check)

## Architecture and Technical Decisions

- **Prices in pence**: All prices stored as integers (pence) to avoid floating-point rounding
- **Server-side price lookup**: Order totals calculated server-side from DB prices
- **SWR with polling**: Kitchen dashboard (10s), order tracking (15s), stats (30s)
- **Status workflow**: `pending → preparing → ready → delivered` with `cancelled` from any non-terminal state
- **Single-site model**: One kitchen, no multi-location in v1
- **Payment**: In-person only (cash/card/donation box)
- **Staff PIN**: Simple 4-digit PIN, localStorage session, not security-critical
- **Service hours**: Enforced both client-side (UI disabled) and server-side (API rejects). Fail-open if settings can't be read
- **Kitchen settings**: Key-value table for flexibility. Settings cached via SWR on client
- **Accessibility**: WCAG 2.1 AA target — semantic HTML, ARIA landmarks, 44px touch targets, high contrast text, skip navigation
- **Component extraction**: Shared components in `src/components/breakfast/` to reduce page file sizes and enable reuse