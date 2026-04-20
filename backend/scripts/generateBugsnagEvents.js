require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Bugsnag = require('@bugsnag/js');

const TOTAL_EVENTS        = 500;
const BREADCRUMBS_PER_EVENT = 100;
const DELAY_MS            = 100;
const LOG_INTERVAL        = 50;

// ---------------------------------------------------------------------------
// BREADCRUMB POOL — 420 entries, every message string is unique
// Uniqueness is achieved by embedding the varying value into the message.
// Each event receives a sliding window of 100 from this pool, so all 420
// unique breadcrumbs appear across the 500 events.
// ---------------------------------------------------------------------------

// ── NAVIGATION (30) ─────────────────────────────────────────────────────────
const NAVIGATION = [
  { message: 'Navigated to: Home',                                  data: { page: 'home',         url: '/' } },
  { message: 'Navigated to: Products List',                         data: { page: 'products',     url: '/products' } },
  { message: 'Navigated to: Product PROD_001 - Wireless Mouse',     data: { productId: 'PROD_001', price: 499 } },
  { message: 'Navigated to: Product PROD_002 - USB Keyboard',       data: { productId: 'PROD_002', price: 799 } },
  { message: 'Navigated to: Product PROD_003 - HDMI Cable 2m',      data: { productId: 'PROD_003', price: 199 } },
  { message: 'Navigated to: Product PROD_004 - Laptop Stand',       data: { productId: 'PROD_004', price: 1299 } },
  { message: 'Navigated to: Product PROD_005 - Webcam HD',          data: { productId: 'PROD_005', price: 2999 } },
  { message: 'Navigated to: Product PROD_006 - Headphones NC',      data: { productId: 'PROD_006', price: 2999 } },
  { message: 'Navigated to: Product PROD_007 - Mechanical Keyboard',data: { productId: 'PROD_007', price: 3499 } },
  { message: 'Navigated to: Product PROD_008 - Monitor 27-inch',    data: { productId: 'PROD_008', price: 15999 } },
  { message: 'Navigated to: Cart (2 items)',                        data: { page: 'cart', itemCount: 2 } },
  { message: 'Navigated to: Cart (empty)',                          data: { page: 'cart', itemCount: 0 } },
  { message: 'Navigated to: Checkout - Address Step',               data: { step: 1, stepName: 'address' } },
  { message: 'Navigated to: Checkout - Payment Step',               data: { step: 2, stepName: 'payment' } },
  { message: 'Navigated to: Checkout - Review Step',                data: { step: 3, stepName: 'review' } },
  { message: 'Navigated to: Order Confirmation ORD_001',            data: { orderId: 'ORD_001', total: 998 } },
  { message: 'Navigated to: Order Confirmation ORD_002',            data: { orderId: 'ORD_002', total: 1598 } },
  { message: 'Navigated to: Orders History',                        data: { page: 'orders', count: 5 } },
  { message: 'Navigated to: Order Detail ORD_003',                  data: { orderId: 'ORD_003', status: 'shipped' } },
  { message: 'Navigated to: Search Results - "wireless mouse"',     data: { query: 'wireless mouse', results: 24 } },
  { message: 'Navigated to: Search Results - "laptop stand"',       data: { query: 'laptop stand', results: 12 } },
  { message: 'Navigated to: Category - Electronics',                data: { category: 'electronics', count: 86 } },
  { message: 'Navigated to: Category - Accessories',                data: { category: 'accessories', count: 54 } },
  { message: 'Navigated to: Login Page',                            data: { page: 'login', redirectFrom: '/checkout' } },
  { message: 'Navigated to: Register Page',                         data: { page: 'register' } },
  { message: 'Navigated to: User Profile',                          data: { page: 'profile', userId: 'USR_001' } },
  { message: 'Navigated to: Wishlist',                              data: { page: 'wishlist', itemCount: 3 } },
  { message: 'Navigated to: Admin Dashboard',                       data: { page: 'admin', role: 'admin' } },
  { message: 'Navigated to: Admin Products',                        data: { page: 'admin/products', count: 42 } },
  { message: 'Navigated to: Admin Orders',                          data: { page: 'admin/orders', count: 128 } },
];

// ── USER ACTIONS (80) ────────────────────────────────────────────────────────
const USER = [
  // Search (10)
  { message: 'Action: search_performed - "wireless mouse" (24 results)',    data: { query: 'wireless mouse',    resultsCount: 24 } },
  { message: 'Action: search_performed - "laptop stand" (12 results)',      data: { query: 'laptop stand',      resultsCount: 12 } },
  { message: 'Action: search_performed - "mechanical keyboard" (8 results)',data: { query: 'mechanical keyboard',resultsCount: 8 } },
  { message: 'Action: search_performed - "hdmi cable" (31 results)',        data: { query: 'hdmi cable',        resultsCount: 31 } },
  { message: 'Action: search_performed - "webcam" (19 results)',            data: { query: 'webcam',            resultsCount: 19 } },
  { message: 'Action: search_performed - "monitor" (15 results)',           data: { query: 'monitor',           resultsCount: 15 } },
  { message: 'Action: search_performed - "headphones" (27 results)',        data: { query: 'headphones',        resultsCount: 27 } },
  { message: 'Action: search_performed - "usb hub" (9 results)',            data: { query: 'usb hub',           resultsCount: 9 } },
  { message: 'Action: search_performed - "desk lamp" (6 results)',          data: { query: 'desk lamp',         resultsCount: 6 } },
  { message: 'Action: search_performed - "mousepad xl" (4 results)',        data: { query: 'mousepad xl',       resultsCount: 4 } },
  // Filter (10)
  { message: 'Action: filter_applied - price 0-500',           data: { filter: 'price', value: '0-500' } },
  { message: 'Action: filter_applied - price 500-1000',         data: { filter: 'price', value: '500-1000' } },
  { message: 'Action: filter_applied - price 1000-5000',        data: { filter: 'price', value: '1000-5000' } },
  { message: 'Action: filter_applied - category Electronics',   data: { filter: 'category', value: 'electronics' } },
  { message: 'Action: filter_applied - category Accessories',   data: { filter: 'category', value: 'accessories' } },
  { message: 'Action: filter_applied - rating 4+',              data: { filter: 'rating', value: '4' } },
  { message: 'Action: filter_applied - rating 3+',              data: { filter: 'rating', value: '3' } },
  { message: 'Action: filter_applied - brand Logitech',         data: { filter: 'brand', value: 'logitech' } },
  { message: 'Action: filter_applied - brand Sony',             data: { filter: 'brand', value: 'sony' } },
  { message: 'Action: filter_applied - in_stock only',          data: { filter: 'availability', value: 'in_stock' } },
  // Sort (5)
  { message: 'Action: sort_changed - price_asc',       data: { sort: 'price_asc' } },
  { message: 'Action: sort_changed - price_desc',      data: { sort: 'price_desc' } },
  { message: 'Action: sort_changed - newest_first',    data: { sort: 'newest_first' } },
  { message: 'Action: sort_changed - rating_desc',     data: { sort: 'rating_desc' } },
  { message: 'Action: sort_changed - popularity_desc', data: { sort: 'popularity_desc' } },
  // Add to cart (8)
  { message: 'Action: add_to_cart - PROD_001 qty 1', data: { productId: 'PROD_001', quantity: 1, price: 499 } },
  { message: 'Action: add_to_cart - PROD_002 qty 1', data: { productId: 'PROD_002', quantity: 1, price: 799 } },
  { message: 'Action: add_to_cart - PROD_003 qty 2', data: { productId: 'PROD_003', quantity: 2, price: 199 } },
  { message: 'Action: add_to_cart - PROD_004 qty 1', data: { productId: 'PROD_004', quantity: 1, price: 1299 } },
  { message: 'Action: add_to_cart - PROD_005 qty 1', data: { productId: 'PROD_005', quantity: 1, price: 2999 } },
  { message: 'Action: add_to_cart - PROD_006 qty 1', data: { productId: 'PROD_006', quantity: 1, price: 2999 } },
  { message: 'Action: add_to_cart - PROD_007 qty 1', data: { productId: 'PROD_007', quantity: 1, price: 3499 } },
  { message: 'Action: add_to_cart - PROD_008 qty 1', data: { productId: 'PROD_008', quantity: 1, price: 15999 } },
  // Remove from cart (5)
  { message: 'Action: remove_from_cart - PROD_002', data: { productId: 'PROD_002' } },
  { message: 'Action: remove_from_cart - PROD_004', data: { productId: 'PROD_004' } },
  { message: 'Action: remove_from_cart - PROD_006', data: { productId: 'PROD_006' } },
  { message: 'Action: remove_from_cart - PROD_007', data: { productId: 'PROD_007' } },
  { message: 'Action: remove_from_cart - PROD_008', data: { productId: 'PROD_008' } },
  // Quantity update (5)
  { message: 'Action: quantity_updated - PROD_001 → qty 2', data: { productId: 'PROD_001', newQuantity: 2 } },
  { message: 'Action: quantity_updated - PROD_003 → qty 3', data: { productId: 'PROD_003', newQuantity: 3 } },
  { message: 'Action: quantity_updated - PROD_005 → qty 2', data: { productId: 'PROD_005', newQuantity: 2 } },
  { message: 'Action: quantity_updated - PROD_001 → qty 1', data: { productId: 'PROD_001', newQuantity: 1 } },
  { message: 'Action: quantity_updated - PROD_003 → qty 1', data: { productId: 'PROD_003', newQuantity: 1 } },
  // Coupon (5)
  { message: 'Action: coupon_applied - SAVE10 (discount ₹50)',      data: { coupon: 'SAVE10',   discount: 50 } },
  { message: 'Action: coupon_applied - FIRST20 (discount ₹199)',    data: { coupon: 'FIRST20',  discount: 199 } },
  { message: 'Action: coupon_applied - FLASH15 (discount ₹120)',    data: { coupon: 'FLASH15',  discount: 120 } },
  { message: 'Action: coupon_rejected - EXPIRED50 (invalid)',       data: { coupon: 'EXPIRED50', reason: 'expired' } },
  { message: 'Action: coupon_removed',                              data: { previousCoupon: 'SAVE10' } },
  // Address (5)
  { message: 'Action: address_selected - ADDR_001 Home Bangalore',  data: { addressId: 'ADDR_001', type: 'home',   city: 'Bangalore' } },
  { message: 'Action: address_selected - ADDR_002 Office Mumbai',   data: { addressId: 'ADDR_002', type: 'office', city: 'Mumbai' } },
  { message: 'Action: address_added - new address Delhi',           data: { type: 'home', city: 'Delhi' } },
  { message: 'Action: address_edited - ADDR_001',                   data: { addressId: 'ADDR_001' } },
  { message: 'Action: address_deleted - ADDR_003',                  data: { addressId: 'ADDR_003' } },
  // Payment (5)
  { message: 'Action: payment_method_selected - credit_card',  data: { method: 'credit_card' } },
  { message: 'Action: payment_method_selected - debit_card',   data: { method: 'debit_card' } },
  { message: 'Action: payment_method_selected - upi',          data: { method: 'upi' } },
  { message: 'Action: payment_method_selected - net_banking',  data: { method: 'net_banking' } },
  { message: 'Action: payment_method_selected - wallet',       data: { method: 'wallet' } },
  // Order actions (5)
  { message: 'Action: place_order_clicked - total ₹998 (2 items)',  data: { total: 998,  itemsCount: 2 } },
  { message: 'Action: place_order_clicked - total ₹1598 (3 items)', data: { total: 1598, itemsCount: 3 } },
  { message: 'Action: order_cancelled - ORD_001',                   data: { orderId: 'ORD_001' } },
  { message: 'Action: order_return_requested - ORD_002',            data: { orderId: 'ORD_002' } },
  { message: 'Action: order_reordered - ORD_003',                   data: { orderId: 'ORD_003' } },
  // Review (5)
  { message: 'Action: review_submitted - PROD_001 rating 5', data: { productId: 'PROD_001', rating: 5 } },
  { message: 'Action: review_submitted - PROD_002 rating 4', data: { productId: 'PROD_002', rating: 4 } },
  { message: 'Action: review_submitted - PROD_003 rating 3', data: { productId: 'PROD_003', rating: 3 } },
  { message: 'Action: review_submitted - PROD_005 rating 5', data: { productId: 'PROD_005', rating: 5 } },
  { message: 'Action: review_helpful_voted - REV_001',        data: { reviewId: 'REV_001', helpful: true } },
  // Wishlist (5)
  { message: 'Action: wishlist_added - PROD_004',          data: { productId: 'PROD_004' } },
  { message: 'Action: wishlist_added - PROD_007',          data: { productId: 'PROD_007' } },
  { message: 'Action: wishlist_removed - PROD_004',        data: { productId: 'PROD_004' } },
  { message: 'Action: wishlist_moved_to_cart - PROD_007',  data: { productId: 'PROD_007' } },
  { message: 'Action: wishlist_shared',                    data: { itemCount: 2 } },
  // Misc (7)
  { message: 'Action: tab_switched - description → reviews',     data: { from: 'description', to: 'reviews' } },
  { message: 'Action: tab_switched - reviews → specifications',  data: { from: 'reviews', to: 'specifications' } },
  { message: 'Action: image_gallery_swiped - PROD_001 image 2',  data: { productId: 'PROD_001', index: 2 } },
  { message: 'Action: image_gallery_swiped - PROD_006 image 3',  data: { productId: 'PROD_006', index: 3 } },
  { message: 'Action: newsletter_signup - source checkout_footer',data: { source: 'checkout_footer' } },
  { message: 'Action: notifications_enabled',                    data: { permission: 'granted' } },
  { message: 'Action: compare_added - PROD_001 vs PROD_002',     data: { products: ['PROD_001', 'PROD_002'] } },
];

// ── API REQUESTS (100) ───────────────────────────────────────────────────────
const REQUEST = [
  // GET products (9)
  { message: 'API: GET /products → 200 (142ms)',                       data: { status: 200, duration: '142ms' } },
  { message: 'API: GET /products?page=2 → 200 (167ms)',                data: { status: 200, duration: '167ms' } },
  { message: 'API: GET /products?page=3 → 200 (134ms)',                data: { status: 200, duration: '134ms' } },
  { message: 'API: GET /products?category=electronics → 200 (220ms)', data: { status: 200, duration: '220ms' } },
  { message: 'API: GET /products?category=accessories → 200 (198ms)', data: { status: 200, duration: '198ms' } },
  { message: 'API: GET /products?sort=price_asc → 200 (189ms)',        data: { status: 200, duration: '189ms' } },
  { message: 'API: GET /products?sort=rating_desc → 200 (201ms)',      data: { status: 200, duration: '201ms' } },
  { message: 'API: GET /products/search?q=wireless+mouse → 200 (267ms)', data: { status: 200, duration: '267ms' } },
  { message: 'API: GET /products/search?q=laptop+stand → 200 (234ms)',   data: { status: 200, duration: '234ms' } },
  // GET product detail (8)
  { message: 'API: GET /products/PROD_001 → 200 (89ms)',   data: { status: 200, duration: '89ms' } },
  { message: 'API: GET /products/PROD_002 → 200 (92ms)',   data: { status: 200, duration: '92ms' } },
  { message: 'API: GET /products/PROD_003 → 200 (78ms)',   data: { status: 200, duration: '78ms' } },
  { message: 'API: GET /products/PROD_004 → 200 (105ms)',  data: { status: 200, duration: '105ms' } },
  { message: 'API: GET /products/PROD_005 → 200 (88ms)',   data: { status: 200, duration: '88ms' } },
  { message: 'API: GET /products/PROD_006 → 200 (94ms)',   data: { status: 200, duration: '94ms' } },
  { message: 'API: GET /products/PROD_007 → 404 (45ms)',   data: { status: 404, duration: '45ms' } },
  { message: 'API: GET /products/PROD_008 → 200 (112ms)',  data: { status: 200, duration: '112ms' } },
  // Cart (7)
  { message: 'API: GET /cart → 200 (67ms)',            data: { status: 200, duration: '67ms' } },
  { message: 'API: POST /cart → 201 (203ms)',          data: { status: 201, duration: '203ms' } },
  { message: 'API: POST /cart → 400 (34ms)',           data: { status: 400, duration: '34ms' } },
  { message: 'API: PUT /cart/ITEM_001 → 200 (134ms)',  data: { status: 200, duration: '134ms' } },
  { message: 'API: PUT /cart/ITEM_002 → 200 (145ms)',  data: { status: 200, duration: '145ms' } },
  { message: 'API: DELETE /cart/ITEM_001 → 200 (98ms)',data: { status: 200, duration: '98ms' } },
  { message: 'API: DELETE /cart/ITEM_002 → 200 (87ms)',data: { status: 200, duration: '87ms' } },
  // Auth (12)
  { message: 'API: POST /auth/login → 200 (310ms)',          data: { status: 200, duration: '310ms' } },
  { message: 'API: POST /auth/login → 401 (89ms)',           data: { status: 401, duration: '89ms' } },
  { message: 'API: POST /auth/register → 201 (445ms)',       data: { status: 201, duration: '445ms' } },
  { message: 'API: POST /auth/register → 422 (67ms)',        data: { status: 422, duration: '67ms' } },
  { message: 'API: POST /auth/logout → 200 (45ms)',          data: { status: 200, duration: '45ms' } },
  { message: 'API: GET /auth/profile → 200 (55ms)',          data: { status: 200, duration: '55ms' } },
  { message: 'API: PUT /auth/profile → 200 (189ms)',         data: { status: 200, duration: '189ms' } },
  { message: 'API: PUT /auth/profile → 422 (67ms)',          data: { status: 422, duration: '67ms' } },
  { message: 'API: PUT /auth/password → 200 (345ms)',        data: { status: 200, duration: '345ms' } },
  { message: 'API: PUT /auth/password → 400 (45ms)',         data: { status: 400, duration: '45ms' } },
  { message: 'API: POST /auth/refresh-token → 200 (67ms)',   data: { status: 200, duration: '67ms' } },
  { message: 'API: POST /auth/refresh-token → 401 (23ms)',   data: { status: 401, duration: '23ms' } },
  // Orders (11)
  { message: 'API: GET /orders → 200 (178ms)',                    data: { status: 200, duration: '178ms' } },
  { message: 'API: GET /orders?status=pending → 200 (156ms)',     data: { status: 200, duration: '156ms' } },
  { message: 'API: GET /orders?status=delivered → 200 (201ms)',   data: { status: 200, duration: '201ms' } },
  { message: 'API: GET /orders/ORD_001 → 200 (112ms)',            data: { status: 200, duration: '112ms' } },
  { message: 'API: GET /orders/ORD_002 → 200 (98ms)',             data: { status: 200, duration: '98ms' } },
  { message: 'API: GET /orders/ORD_003 → 200 (134ms)',            data: { status: 200, duration: '134ms' } },
  { message: 'API: GET /orders/ORD_004 → 404 (34ms)',             data: { status: 404, duration: '34ms' } },
  { message: 'API: POST /orders → 201 (456ms)',                   data: { status: 201, duration: '456ms' } },
  { message: 'API: POST /orders → 422 (89ms)',                    data: { status: 422, duration: '89ms' } },
  { message: 'API: POST /orders → 500 (2100ms)',                  data: { status: 500, duration: '2100ms' } },
  { message: 'API: POST /orders/ORD_001/cancel → 200 (134ms)',    data: { status: 200, duration: '134ms' } },
  // Payments (5)
  { message: 'API: POST /payments/initiate → 200 (567ms)',   data: { status: 200, duration: '567ms' } },
  { message: 'API: POST /payments/initiate → 504 (30001ms)', data: { status: 504, duration: '30001ms' } },
  { message: 'API: POST /payments/verify → 200 (234ms)',     data: { status: 200, duration: '234ms' } },
  { message: 'API: POST /payments/verify → 400 (56ms)',      data: { status: 400, duration: '56ms' } },
  { message: 'API: GET /payments/status/PAY_001 → 200 (89ms)',data: { status: 200, duration: '89ms' } },
  // Admin (10)
  { message: 'API: GET /admin/dashboard → 200 (345ms)',              data: { status: 200, duration: '345ms' } },
  { message: 'API: GET /admin/products → 200 (456ms)',               data: { status: 200, duration: '456ms' } },
  { message: 'API: GET /admin/orders → 200 (389ms)',                 data: { status: 200, duration: '389ms' } },
  { message: 'API: GET /admin/users → 200 (234ms)',                  data: { status: 200, duration: '234ms' } },
  { message: 'API: POST /admin/products → 201 (567ms)',              data: { status: 201, duration: '567ms' } },
  { message: 'API: PUT /admin/products/PROD_001 → 200 (345ms)',      data: { status: 200, duration: '345ms' } },
  { message: 'API: DELETE /admin/products/PROD_009 → 200 (189ms)',   data: { status: 200, duration: '189ms' } },
  { message: 'API: PUT /admin/orders/ORD_001/status → 200 (123ms)',  data: { status: 200, duration: '123ms' } },
  { message: 'API: GET /admin/analytics → 200 (678ms)',              data: { status: 200, duration: '678ms' } },
  { message: 'API: POST /admin/products/bulk-update → 200 (1234ms)', data: { status: 200, duration: '1234ms' } },
  // Wishlist (4)
  { message: 'API: POST /wishlist/PROD_004 → 201 (89ms)',    data: { status: 201, duration: '89ms' } },
  { message: 'API: POST /wishlist/PROD_007 → 201 (76ms)',    data: { status: 201, duration: '76ms' } },
  { message: 'API: DELETE /wishlist/PROD_004 → 200 (67ms)',  data: { status: 200, duration: '67ms' } },
  { message: 'API: DELETE /wishlist/PROD_006 → 200 (72ms)',  data: { status: 200, duration: '72ms' } },
  // Reviews (4)
  { message: 'API: GET /products/PROD_001/reviews → 200 (145ms)',  data: { status: 200, duration: '145ms' } },
  { message: 'API: GET /products/PROD_002/reviews → 200 (167ms)',  data: { status: 200, duration: '167ms' } },
  { message: 'API: POST /products/PROD_001/reviews → 201 (234ms)', data: { status: 201, duration: '234ms' } },
  { message: 'API: POST /products/PROD_002/reviews → 422 (56ms)',  data: { status: 422, duration: '56ms' } },
  // Misc (30)
  { message: 'API: GET /categories → 200 (89ms)',                          data: { status: 200, duration: '89ms' } },
  { message: 'API: GET /banners → 200 (56ms)',                             data: { status: 200, duration: '56ms' } },
  { message: 'API: GET /recommendations → 200 (234ms)',                    data: { status: 200, duration: '234ms' } },
  { message: 'API: GET /coupons/SAVE10/validate → 200 (78ms)',             data: { status: 200, duration: '78ms' } },
  { message: 'API: GET /coupons/EXPIRED50/validate → 422 (45ms)',          data: { status: 422, duration: '45ms' } },
  { message: 'API: GET /shipping/estimate?pincode=560034 → 200 (134ms)',   data: { status: 200, duration: '134ms' } },
  { message: 'API: GET /shipping/estimate?pincode=999999 → 422 (56ms)',    data: { status: 422, duration: '56ms' } },
  { message: 'API: POST /newsletter/subscribe → 201 (89ms)',               data: { status: 201, duration: '89ms' } },
  { message: 'API: GET /inventory/PROD_001 → 200 (67ms)',                  data: { status: 200, duration: '67ms' } },
  { message: 'API: GET /inventory/PROD_003 → 200 (78ms)',                  data: { status: 200, duration: '78ms' } },
  { message: 'API: GET /inventory/PROD_007 → 200 (45ms)',                  data: { status: 200, duration: '45ms', stock: 0 } },
  { message: 'API: GET /auth/sessions → 200 (89ms)',                       data: { status: 200, duration: '89ms' } },
  { message: 'API: DELETE /auth/sessions/all → 200 (112ms)',               data: { status: 200, duration: '112ms' } },
  { message: 'API: GET /addresses → 200 (98ms)',                           data: { status: 200, duration: '98ms' } },
  { message: 'API: POST /addresses → 201 (167ms)',                         data: { status: 201, duration: '167ms' } },
  { message: 'API: PUT /addresses/ADDR_001 → 200 (112ms)',                 data: { status: 200, duration: '112ms' } },
  { message: 'API: DELETE /addresses/ADDR_003 → 200 (89ms)',               data: { status: 200, duration: '89ms' } },
  { message: 'API: GET /notifications → 200 (78ms)',                       data: { status: 200, duration: '78ms' } },
  { message: 'API: PUT /notifications/settings → 200 (78ms)',              data: { status: 200, duration: '78ms' } },
  { message: 'API: POST /analytics/event → 200 (34ms)',                    data: { status: 200, duration: '34ms' } },
  { message: 'API: GET /products/PROD_001/related → 200 (189ms)',          data: { status: 200, duration: '189ms' } },
  { message: 'API: GET /products/PROD_003/related → 200 (156ms)',          data: { status: 200, duration: '156ms' } },
  { message: 'API: POST /orders/ORD_002/return → 201 (167ms)',             data: { status: 201, duration: '167ms' } },
  { message: 'API: DELETE /reviews/REV_001 → 200 (56ms)',                  data: { status: 200, duration: '56ms' } },
  { message: 'API: DELETE /cart/ITEM_003 → 200 (92ms)',                    data: { status: 200, duration: '92ms' } },
  { message: 'API: PUT /cart/ITEM_003 → 200 (123ms)',                      data: { status: 200, duration: '123ms' } },
  { message: 'API: GET /products?brand=logitech → 200 (213ms)',            data: { status: 200, duration: '213ms' } },
  { message: 'API: GET /products?rating=4 → 200 (198ms)',                  data: { status: 200, duration: '198ms' } },
  { message: 'API: PUT /orders/ORD_004/status → 200 (145ms)',              data: { status: 200, duration: '145ms' } },
  { message: 'API: GET /orders/ORD_005 → 200 (101ms)',                     data: { status: 200, duration: '101ms' } },
];

// ── STATE CHANGES (100) ──────────────────────────────────────────────────────
const STATE = [
  // Cart (20)
  { message: 'Cart State: 0 items, total ₹0',                              data: { itemsCount: 0, total: 0 } },
  { message: 'Cart State: 1 item (PROD_001), total ₹499',                  data: { itemsCount: 1, total: 499 } },
  { message: 'Cart State: 1 item (PROD_002), total ₹799',                  data: { itemsCount: 1, total: 799 } },
  { message: 'Cart State: 2 items (PROD_001 + PROD_002), total ₹1298',     data: { itemsCount: 2, total: 1298 } },
  { message: 'Cart State: 2 items (PROD_001 × 2), total ₹998',             data: { itemsCount: 2, total: 998 } },
  { message: 'Cart State: 3 items, total ₹1697',                           data: { itemsCount: 3, total: 1697 } },
  { message: 'Cart State: 3 items, total ₹2596',                           data: { itemsCount: 3, total: 2596 } },
  { message: 'Cart State: 4 items, total ₹2097',                           data: { itemsCount: 4, total: 2097 } },
  { message: 'Cart State: 1 item (PROD_003), total ₹199',                  data: { itemsCount: 1, total: 199 } },
  { message: 'Cart State: 2 items (PROD_001 + PROD_006), total ₹3498',     data: { itemsCount: 2, total: 3498 } },
  { message: 'Cart: coupon SAVE10 applied, discount ₹50',                  data: { coupon: 'SAVE10',  discount: 50 } },
  { message: 'Cart: coupon FIRST20 applied, discount ₹199',                data: { coupon: 'FIRST20', discount: 199 } },
  { message: 'Cart: coupon removed',                                       data: { previousCoupon: 'SAVE10' } },
  { message: 'Cart: cleared',                                              data: { previousItemCount: 2 } },
  { message: 'Cart: synced with server (2 items)',                         data: { itemsCount: 2, source: 'server' } },
  { message: 'Cart: conflict resolved (local 2 items, server 1)',          data: { localCount: 2, serverCount: 1 } },
  { message: 'Cart: PROD_004 marked out of stock',                         data: { productId: 'PROD_004', stock: 0 } },
  { message: 'Cart: shipping estimated ₹49',                               data: { shipping: 49 } },
  { message: 'Cart: free shipping unlocked (total > ₹999)',                data: { total: 1298, threshold: 999 } },
  { message: 'Cart: total recalculated with tax ₹1097.55',                 data: { subtotal: 998, tax: 49.90, total: 1047.90 } },
  // Auth (15)
  { message: 'Auth: user USR_001 logged in (role: customer)',   data: { userId: 'USR_001', role: 'customer' } },
  { message: 'Auth: user USR_002 logged in (role: admin)',      data: { userId: 'USR_002', role: 'admin' } },
  { message: 'Auth: user USR_003 logged in (role: customer)',   data: { userId: 'USR_003', role: 'customer' } },
  { message: 'Auth: anonymous session started (SES_001)',       data: { sessionId: 'SES_001' } },
  { message: 'Auth: anonymous session started (SES_002)',       data: { sessionId: 'SES_002' } },
  { message: 'Auth: token refreshed for USR_001',               data: { userId: 'USR_001' } },
  { message: 'Auth: token refresh failed - redirecting to login',data: { reason: 'refresh_expired' } },
  { message: 'Auth: user USR_001 logged out',                   data: { userId: 'USR_001' } },
  { message: 'Auth: profile updated for USR_001',               data: { userId: 'USR_001', fields: ['name', 'phone'] } },
  { message: 'Auth: password changed for USR_001',              data: { userId: 'USR_001' } },
  { message: 'Auth: login failed - invalid credentials',         data: { attempt: 1 } },
  { message: 'Auth: login failed - account locked (5 attempts)',  data: { attempt: 5 } },
  { message: 'Auth: session expired',                           data: { sessionId: 'SES_003' } },
  { message: 'Auth: remember me enabled for USR_001',           data: { userId: 'USR_001' } },
  { message: 'Auth: 2FA verification skipped',                  data: { reason: 'not_enrolled' } },
  // Orders (25)
  { message: 'Order ORD_001 created - pending, total ₹998',         data: { orderId: 'ORD_001', status: 'pending',    total: 998 } },
  { message: 'Order ORD_001 updated - status: processing',          data: { orderId: 'ORD_001', status: 'processing' } },
  { message: 'Order ORD_001 updated - status: shipped (TRK_001)',   data: { orderId: 'ORD_001', status: 'shipped',    tracking: 'TRK_001' } },
  { message: 'Order ORD_001 updated - status: delivered',           data: { orderId: 'ORD_001', status: 'delivered' } },
  { message: 'Order ORD_002 created - pending, total ₹1598',        data: { orderId: 'ORD_002', status: 'pending',    total: 1598 } },
  { message: 'Order ORD_002 updated - status: processing',          data: { orderId: 'ORD_002', status: 'processing' } },
  { message: 'Order ORD_002 updated - status: cancelled',           data: { orderId: 'ORD_002', status: 'cancelled',  reason: 'user_request' } },
  { message: 'Order ORD_003 created - pending, total ₹499',         data: { orderId: 'ORD_003', status: 'pending',    total: 499 } },
  { message: 'Order ORD_003 updated - status: shipped (TRK_003)',   data: { orderId: 'ORD_003', status: 'shipped',    tracking: 'TRK_003' } },
  { message: 'Order ORD_004 created - pending, total ₹2596',        data: { orderId: 'ORD_004', status: 'pending',    total: 2596 } },
  { message: 'Order ORD_004 payment failed (attempt 1)',            data: { orderId: 'ORD_004', paymentAttempt: 1 } },
  { message: 'Order ORD_004 payment failed (attempt 2)',            data: { orderId: 'ORD_004', paymentAttempt: 2 } },
  { message: 'Order ORD_004 updated - status: processing',          data: { orderId: 'ORD_004', status: 'processing' } },
  { message: 'Order ORD_005 return requested - item PROD_002',      data: { orderId: 'ORD_005', productId: 'PROD_002' } },
  { message: 'Order ORD_005 return approved',                       data: { orderId: 'ORD_005' } },
  { message: 'Order ORD_005 refund initiated ₹799',                 data: { orderId: 'ORD_005', refundAmount: 799 } },
  { message: 'Order ORD_006 created - pending, total ₹3498',        data: { orderId: 'ORD_006', status: 'pending',    total: 3498 } },
  { message: 'Order ORD_006 updated - status: out_for_delivery',    data: { orderId: 'ORD_006', status: 'out_for_delivery' } },
  { message: 'Order ORD_006 updated - status: delivered',           data: { orderId: 'ORD_006', status: 'delivered' } },
  { message: 'Order list refreshed (5 orders)',                     data: { count: 5 } },
  { message: 'Order ORD_001 invoice downloaded',                    data: { orderId: 'ORD_001' } },
  { message: 'Order ORD_003 reviewed (rating 5)',                   data: { orderId: 'ORD_003', rating: 5 } },
  { message: 'Order ORD_002 reordered → new ORD_007',               data: { sourceOrderId: 'ORD_002', newOrderId: 'ORD_007' } },
  { message: 'Order ORD_007 created - pending, total ₹1598',        data: { orderId: 'ORD_007', status: 'pending',    total: 1598 } },
  { message: 'Order ORD_007 updated - status: processing',          data: { orderId: 'ORD_007', status: 'processing' } },
  // Products (20)
  { message: 'Product PROD_001 (Wireless Mouse) viewed - ₹499',          data: { productId: 'PROD_001', price: 499 } },
  { message: 'Product PROD_002 (USB Keyboard) viewed - ₹799',            data: { productId: 'PROD_002', price: 799 } },
  { message: 'Product PROD_003 (HDMI Cable 2m) viewed - ₹199',           data: { productId: 'PROD_003', price: 199 } },
  { message: 'Product PROD_004 (Laptop Stand) viewed - ₹1299',           data: { productId: 'PROD_004', price: 1299 } },
  { message: 'Product PROD_005 (Webcam HD) viewed - ₹2999',              data: { productId: 'PROD_005', price: 2999 } },
  { message: 'Product PROD_006 (Headphones NC) viewed - ₹2999',          data: { productId: 'PROD_006', price: 2999 } },
  { message: 'Product PROD_007 (Mechanical Keyboard) viewed - ₹3499',    data: { productId: 'PROD_007', price: 3499 } },
  { message: 'Product PROD_008 (Monitor 27-inch) viewed - ₹15999',       data: { productId: 'PROD_008', price: 15999 } },
  { message: 'Product PROD_001 added to wishlist',                        data: { productId: 'PROD_001' } },
  { message: 'Product PROD_006 added to wishlist',                        data: { productId: 'PROD_006' } },
  { message: 'Product list page 1 loaded (20 items)',                     data: { page: 1, count: 20 } },
  { message: 'Product list page 2 loaded (20 items)',                     data: { page: 2, count: 20 } },
  { message: 'Product list filtered (8 results)',                         data: { results: 8 } },
  { message: 'Product PROD_001 stock: 24 units',                          data: { productId: 'PROD_001', stock: 24 } },
  { message: 'Product PROD_004 stock: 3 units (low)',                     data: { productId: 'PROD_004', stock: 3, lowStock: true } },
  { message: 'Product PROD_007 stock: out of stock',                      data: { productId: 'PROD_007', stock: 0 } },
  { message: 'Product PROD_005 review count updated: 142',                data: { productId: 'PROD_005', reviewCount: 142 } },
  { message: 'Product PROD_003 price updated to ₹179 (sale)',             data: { productId: 'PROD_003', oldPrice: 199, newPrice: 179 } },
  { message: 'Product PROD_008 added to comparison',                      data: { productId: 'PROD_008' } },
  { message: 'Product search: "wireless mouse" → 24 results',             data: { query: 'wireless mouse', results: 24 } },
  // Redux (20)
  { message: 'Redux: cart/addItem PROD_001',         data: { slice: 'cart',    action: 'addItem',        productId: 'PROD_001' } },
  { message: 'Redux: cart/removeItem PROD_002',      data: { slice: 'cart',    action: 'removeItem',     productId: 'PROD_002' } },
  { message: 'Redux: cart/updateQuantity PROD_003',  data: { slice: 'cart',    action: 'updateQuantity', productId: 'PROD_003' } },
  { message: 'Redux: cart/clearCart',                data: { slice: 'cart',    action: 'clearCart' } },
  { message: 'Redux: cart/applyCoupon SAVE10',       data: { slice: 'cart',    action: 'applyCoupon',    coupon: 'SAVE10' } },
  { message: 'Redux: auth/setUser USR_001',          data: { slice: 'auth',    action: 'setUser',        userId: 'USR_001' } },
  { message: 'Redux: auth/clearUser',                data: { slice: 'auth',    action: 'clearUser' } },
  { message: 'Redux: auth/setLoading true',          data: { slice: 'auth',    action: 'setLoading',     value: true } },
  { message: 'Redux: auth/setError login_failed',    data: { slice: 'auth',    action: 'setError',       error: 'login_failed' } },
  { message: 'Redux: auth/clearError',               data: { slice: 'auth',    action: 'clearError' } },
  { message: 'Redux: orders/setOrders (5 items)',    data: { slice: 'orders',  action: 'setOrders',      count: 5 } },
  { message: 'Redux: orders/addOrder ORD_001',       data: { slice: 'orders',  action: 'addOrder',       orderId: 'ORD_001' } },
  { message: 'Redux: orders/updateOrder ORD_001',    data: { slice: 'orders',  action: 'updateOrder',    orderId: 'ORD_001' } },
  { message: 'Redux: products/setProducts (20)',     data: { slice: 'products',action: 'setProducts',    count: 20 } },
  { message: 'Redux: products/setFilters category:electronics', data: { slice: 'products', action: 'setFilters', filter: 'category:electronics' } },
  { message: 'Redux: products/setLoading true',      data: { slice: 'products',action: 'setLoading',     value: true } },
  { message: 'Redux: products/setError fetch_failed',data: { slice: 'products',action: 'setError',       error: 'fetch_failed' } },
  { message: 'Redux: ui/setModal checkout_confirm',  data: { slice: 'ui',      action: 'setModal',       modal: 'checkout_confirm' } },
  { message: 'Redux: ui/closeModal',                 data: { slice: 'ui',      action: 'closeModal' } },
  { message: 'Redux: ui/setToast "Order placed successfully"', data: { slice: 'ui', action: 'setToast', message: 'Order placed successfully' } },
];

// ── LOGS (80) ────────────────────────────────────────────────────────────────
const LOG = [
  // Form validation (10)
  { message: 'Form validation passed: checkout (5 fields)',               data: { form: 'checkout', fields: 5 } },
  { message: 'Form validation failed: checkout - phone invalid format',   data: { form: 'checkout', field: 'phone', error: 'invalid_format' } },
  { message: 'Form validation failed: checkout - pincode not serviceable',data: { form: 'checkout', field: 'pincode', error: 'not_serviceable' } },
  { message: 'Form validation passed: login (2 fields)',                  data: { form: 'login', fields: 2 } },
  { message: 'Form validation failed: login - email required',            data: { form: 'login', field: 'email', error: 'required' } },
  { message: 'Form validation passed: register (4 fields)',               data: { form: 'register', fields: 4 } },
  { message: 'Form validation failed: register - passwords do not match', data: { form: 'register', field: 'confirmPassword', error: 'mismatch' } },
  { message: 'Form validation failed: register - email already exists',   data: { form: 'register', field: 'email', error: 'duplicate' } },
  { message: 'Form validation passed: address (6 fields)',                data: { form: 'address', fields: 6 } },
  { message: 'Form validation failed: address - pincode invalid',         data: { form: 'address', field: 'pincode', error: 'invalid' } },
  // Component lifecycle (15)
  { message: 'Component mounted: HomePage',           data: { component: 'HomePage' } },
  { message: 'Component mounted: ProductsPage',       data: { component: 'ProductsPage' } },
  { message: 'Component mounted: ProductDetailPage',  data: { component: 'ProductDetailPage' } },
  { message: 'Component mounted: CartPage',           data: { component: 'CartPage' } },
  { message: 'Component mounted: CheckoutPage',       data: { component: 'CheckoutPage' } },
  { message: 'Component mounted: OrdersPage',         data: { component: 'OrdersPage' } },
  { message: 'Component mounted: OrderDetailPage',    data: { component: 'OrderDetailPage' } },
  { message: 'Component mounted: Header',             data: { component: 'Header' } },
  { message: 'Component mounted: ProductCard',        data: { component: 'ProductCard' } },
  { message: 'Component unmounted: ProductDetailPage',data: { component: 'ProductDetailPage' } },
  { message: 'Component unmounted: CartPage',         data: { component: 'CartPage' } },
  { message: 'Component unmounted: CheckoutPage',     data: { component: 'CheckoutPage' } },
  { message: 'Component unmounted: LoginPage',        data: { component: 'LoginPage' } },
  { message: 'Component unmounted: ProductsPage',     data: { component: 'ProductsPage' } },
  { message: 'Component unmounted: OrdersPage',       data: { component: 'OrdersPage' } },
  // Cache (10)
  { message: 'Cache hit: products_page_1 (age: 45s)',    data: { key: 'products_page_1', age: '45s' } },
  { message: 'Cache hit: products_page_2 (age: 23s)',    data: { key: 'products_page_2', age: '23s' } },
  { message: 'Cache hit: product_PROD_001 (age: 12s)',   data: { key: 'product_PROD_001', age: '12s' } },
  { message: 'Cache miss: products_page_4',              data: { key: 'products_page_4' } },
  { message: 'Cache miss: product_PROD_009',             data: { key: 'product_PROD_009' } },
  { message: 'Cache invalidated: cart (user action)',    data: { key: 'cart', reason: 'user_action' } },
  { message: 'Cache invalidated: orders (new order)',    data: { key: 'orders', reason: 'new_order' } },
  { message: 'Cache stale: products_page_1 (age: 301s)',  data: { key: 'products_page_1', age: '301s' } },
  { message: 'Cache warmed: categories',                 data: { key: 'categories' } },
  { message: 'Cache cleared: session end',               data: { reason: 'session_end' } },
  // Feature flags (5)
  { message: 'Feature flag: new_checkout_flow = true',    data: { flag: 'new_checkout_flow',  enabled: true } },
  { message: 'Feature flag: dark_mode = false',           data: { flag: 'dark_mode',          enabled: false } },
  { message: 'Feature flag: recommendations_v2 = true',  data: { flag: 'recommendations_v2', enabled: true } },
  { message: 'Feature flag: express_delivery = false',   data: { flag: 'express_delivery',   enabled: false } },
  { message: 'Feature flag: admin_analytics_v2 = true',  data: { flag: 'admin_analytics_v2', enabled: true } },
  // Lazy loading (5)
  { message: 'Lazy loaded: CheckoutPage',                data: { component: 'CheckoutPage' } },
  { message: 'Lazy loaded: AdminDashboard',              data: { component: 'AdminDashboard' } },
  { message: 'Lazy loaded: OrderDetailPage',             data: { component: 'OrderDetailPage' } },
  { message: 'Lazy loaded: ProductsPage',                data: { component: 'ProductsPage' } },
  { message: 'Lazy load failed: AdminAnalytics (retrying)',data: { component: 'AdminAnalytics', retrying: true } },
  // LocalStorage (5)
  { message: 'LocalStorage read: user (found)',          data: { key: 'user', found: true } },
  { message: 'LocalStorage read: cart (not found)',      data: { key: 'cart', found: false } },
  { message: 'LocalStorage write: user',                 data: { key: 'user' } },
  { message: 'LocalStorage cleared: logout',            data: { reason: 'logout' } },
  { message: 'LocalStorage read: preferences (found)',   data: { key: 'preferences', found: true } },
  // Image loading (5)
  { message: 'Image load failed: /images/PROD_003.jpg (fallback)',  data: { src: '/images/PROD_003.jpg', fallback: true } },
  { message: 'Image load failed: /images/PROD_008-2.jpg (fallback)',data: { src: '/images/PROD_008-2.jpg', fallback: true } },
  { message: 'Image loaded: /images/PROD_001.jpg (234ms)',          data: { src: '/images/PROD_001.jpg', duration: '234ms' } },
  { message: 'Image lazy-loaded: /images/PROD_006.jpg',             data: { src: '/images/PROD_006.jpg' } },
  { message: 'Image preloaded: /images/PROD_002.jpg',               data: { src: '/images/PROD_002.jpg' } },
  // Performance (5)
  { message: 'Performance: LCP 1.2s (good)',            data: { metric: 'LCP', value: '1.2s', rating: 'good' } },
  { message: 'Performance: FID 45ms (good)',            data: { metric: 'FID', value: '45ms', rating: 'good' } },
  { message: 'Performance: CLS 0.05 (good)',            data: { metric: 'CLS', value: 0.05, rating: 'good' } },
  { message: 'Performance: API avg response 189ms',     data: { metric: 'api_avg', value: '189ms' } },
  { message: 'Performance: bundle 2.3MB loaded',        data: { metric: 'bundle_size', value: '2.3MB' } },
  // Retry/Recovery (5)
  { message: 'Retry: /api/orders attempt 2/3 (after 500)',          data: { path: '/api/orders',             attempt: 2, maxRetries: 3 } },
  { message: 'Retry: /api/payments attempt 1/3 (after timeout)',    data: { path: '/api/payments/initiate',  attempt: 1, maxRetries: 3 } },
  { message: 'Retry: /api/cart attempt 2/3 (after network error)',  data: { path: '/api/cart',               attempt: 2, maxRetries: 3 } },
  { message: 'Recovery: cart re-synced after conflict',             data: { action: 'cart_resync' } },
  { message: 'Recovery: session restored from localStorage',        data: { action: 'session_restore' } },
  // Debounce/Throttle (5)
  { message: 'Debounce triggered: search input (300ms)',      data: { action: 'search_input',        delay: '300ms' } },
  { message: 'Debounce triggered: address autocomplete (500ms)',data: { action: 'address_autocomplete',delay: '500ms' } },
  { message: 'Throttle triggered: scroll event (100ms)',      data: { action: 'scroll',              delay: '100ms' } },
  { message: 'Debounce cancelled: search cleared',            data: { action: 'search_cleared' } },
  { message: 'Debounce triggered: coupon validation (400ms)', data: { action: 'coupon_validate',     delay: '400ms' } },
  // Misc (10)
  { message: 'Session initialized: SES_001 (new visitor)',                data: { sessionId: 'SES_001', type: 'new' } },
  { message: 'Session initialized: SES_002 (returning user)',             data: { sessionId: 'SES_002', type: 'returning' } },
  { message: 'Session timeout: SES_003 after 30min',                     data: { sessionId: 'SES_003', duration: '30min' } },
  { message: 'Payment form rendered: credit_card',                        data: { method: 'credit_card' } },
  { message: 'Payment form rendered: upi',                                data: { method: 'upi' } },
  { message: 'Address autocomplete: "Koramangala, Bangalore" selected',   data: { value: 'Koramangala, Bangalore' } },
  { message: 'Address autocomplete: "Bandra, Mumbai" selected',           data: { value: 'Bandra, Mumbai' } },
  { message: 'Shipping estimate requested: pincode 560034',               data: { pincode: '560034' } },
  { message: 'Notifications permission: granted',                         data: { permission: 'granted' } },
  { message: 'App version: 1.0.0 loaded',                                 data: { version: '1.0.0' } },
];

// ── ERRORS / WARNINGS (30) ───────────────────────────────────────────────────
const ERROR = [
  { message: 'Warning: API /api/orders slow (2100ms, threshold 2000ms)',        data: { path: '/api/orders',            duration: '2100ms' } },
  { message: 'Warning: API /api/products slow (1800ms, threshold 1000ms)',      data: { path: '/api/products',          duration: '1800ms' } },
  { message: 'Warning: API /api/payments slow (4500ms, threshold 3000ms)',      data: { path: '/api/payments/initiate', duration: '4500ms' } },
  { message: 'Warning: Cart sync conflict (local: 2 items, server: 1)',         data: { localCount: 2, serverCount: 1 } },
  { message: 'Warning: Cart item PROD_007 out of stock',                        data: { productId: 'PROD_007', stock: 0 } },
  { message: 'Warning: Cart item PROD_004 low stock (2 remaining)',             data: { productId: 'PROD_004', stock: 2 } },
  { message: 'Warning: JWT token expiring in 5 minutes',                        data: { expiresIn: '5min' } },
  { message: 'Warning: JWT token expiring in 1 minute',                         data: { expiresIn: '1min' } },
  { message: 'Warning: Offline mode detected',                                  data: { network: 'offline' } },
  { message: 'Warning: Network reconnected after 30s',                          data: { downtime: '30s' } },
  { message: 'Warning: Image /images/PROD_003.jpg failed to load',              data: { src: '/images/PROD_003.jpg' } },
  { message: 'Warning: Image /images/PROD_008-2.jpg failed to load',            data: { src: '/images/PROD_008-2.jpg' } },
  { message: 'Warning: Form field phone format invalid',                        data: { field: 'phone' } },
  { message: 'Warning: Coupon EXPIRED50 no longer valid',                       data: { coupon: 'EXPIRED50' } },
  { message: 'Warning: Address pincode 999999 not serviceable',                 data: { pincode: '999999' } },
  { message: 'Error: Payment gateway razorpay timeout (30s)',                   data: { gateway: 'razorpay',  timeout: '30s' } },
  { message: 'Error: Payment gateway stripe declined (insufficient funds)',      data: { gateway: 'stripe',    reason: 'insufficient_funds' } },
  { message: 'Error: Order ORD_004 payment failed (3 retries exhausted)',        data: { orderId: 'ORD_004',   retries: 3 } },
  { message: 'Error: API /api/orders returned 500',                             data: { path: '/api/orders',  status: 500 } },
  { message: 'Error: API /api/payments/initiate returned 504',                  data: { path: '/api/payments/initiate', status: 504 } },
  { message: 'Error: API /api/cart returned 400 (invalid quantity)',            data: { path: '/api/cart',    status: 400 } },
  { message: 'Error: Authentication failed - invalid credentials',              data: { reason: 'invalid_credentials' } },
  { message: 'Error: Authentication failed - account locked (5 attempts)',       data: { reason: 'account_locked', attempts: 5 } },
  { message: 'Error: PROD_007 inventory check failed (service unavailable)',     data: { productId: 'PROD_007', statusCode: 503 } },
  { message: 'Error: Address validation service returned 503',                  data: { service: 'address_validation', statusCode: 503 } },
  { message: 'Error: Session expired - redirected to login',                    data: { reason: 'session_expired' } },
  { message: 'Error: Lazy load failed for AdminAnalytics',                      data: { component: 'AdminAnalytics' } },
  { message: 'Error: WebSocket connection dropped',                             data: { reason: 'network_interruption' } },
  { message: 'Error: Checkout form submission failed (network error)',           data: { form: 'checkout', reason: 'network_error' } },
  { message: 'Error: Order ORD_004 creation timed out',                         data: { orderId: 'ORD_004', reason: 'timeout' } },
];

// ---------------------------------------------------------------------------
// Build the full ordered pool: 30 + 80 + 100 + 100 + 80 + 30 = 420
// ---------------------------------------------------------------------------
const POOL = [
  ...NAVIGATION.map(b => ({ ...b, type: 'navigation' })),
  ...USER.map(b      => ({ ...b, type: 'user'       })),
  ...REQUEST.map(b   => ({ ...b, type: 'request'    })),
  ...STATE.map(b     => ({ ...b, type: 'state'      })),
  ...LOG.map(b       => ({ ...b, type: 'log'        })),
  ...ERROR.map(b     => ({ ...b, type: 'error'      })),
];

const POOL_SIZE = POOL.length; // 420

// ---------------------------------------------------------------------------
// Error scenarios cycling across 500 events
// ---------------------------------------------------------------------------
const ERROR_SCENARIOS = [
  { name: 'CheckoutError',         message: 'Payment processing failed during checkout',        severity: 'error'   },
  { name: 'CartSyncError',         message: 'Cart failed to sync with server',                  severity: 'warning' },
  { name: 'AuthTokenExpired',      message: 'JWT token expired mid-session',                    severity: 'warning' },
  { name: 'OrderCreationFailed',   message: 'Order could not be created — server rejected',     severity: 'error'   },
  { name: 'ProductLoadError',      message: 'Product detail page failed to load',               severity: 'warning' },
  { name: 'AddressValidationFail', message: 'Shipping address validation returned 422',         severity: 'error'   },
  { name: 'PaymentGatewayTimeout', message: 'Payment gateway timed out after 30s',              severity: 'error'   },
  { name: 'InventoryConflict',     message: 'Item went out of stock between cart and checkout', severity: 'error'   },
  { name: 'CouponExpired',         message: 'Applied coupon code is no longer valid',           severity: 'warning' },
  { name: 'SearchIndexError',      message: 'Search results failed to load',                   severity: 'warning' },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateEvents() {
  if (!process.env.BUGSNAG_API_KEY) {
    console.error('❌  BUGSNAG_API_KEY is not set in .env — aborting.');
    process.exit(1);
  }

  Bugsnag.start({
    apiKey:              process.env.BUGSNAG_API_KEY,
    releaseStage:        process.env.NODE_ENV || 'development',
    enabledReleaseStages:['production', 'staging', 'development'],
    appVersion:          process.env.APP_VERSION || '1.0.0',
    maxBreadcrumbs:      100,
    autoTrackSessions:   false,
    logger:              null,
  });

  console.log(`\n🚀 Starting: ${TOTAL_EVENTS} events × ${BREADCRUMBS_PER_EVENT} breadcrumbs`);
  console.log(`   Pool size: ${POOL_SIZE} unique breadcrumbs (sliding window of 100 per event)\n`);

  const startTime = Date.now();

  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    const scenario = ERROR_SCENARIOS[(i - 1) % ERROR_SCENARIOS.length];
    const offset   = (i - 1) % POOL_SIZE;

    // Sliding window: 100 consecutive entries from the pool (with wrap-around)
    for (let b = 0; b < BREADCRUMBS_PER_EVENT; b++) {
      const crumb = POOL[(offset + b) % POOL_SIZE];
      Bugsnag.leaveBreadcrumb(
        crumb.message,
        { ...crumb.data, eventIndex: i, breadcrumbIndex: b + 1 },
        crumb.type
      );
    }

    const error  = new Error(`[Event ${i}/${TOTAL_EVENTS}] ${scenario.message}`);
    error.name   = scenario.name;

    await new Promise((resolve) => {
      Bugsnag.notify(error, (event) => {
        event.severity = scenario.severity;
        event.context  = 'generate-events-script';
        event.addMetadata('generator', {
          eventIndex:      i,
          totalEvents:     TOTAL_EVENTS,
          breadcrumbCount: BREADCRUMBS_PER_EVENT,
          poolSize:        POOL_SIZE,
          windowOffset:    offset,
          scenario:        scenario.name,
          generatedAt:     new Date().toISOString(),
        });
      }, resolve);
    });

    if (i % LOG_INTERVAL === 0 || i === TOTAL_EVENTS) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ ${i}/${TOTAL_EVENTS} events sent  (${elapsed}s elapsed)`);
    }

    await delay(DELAY_MS);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done — ${TOTAL_EVENTS} events × ${BREADCRUMBS_PER_EVENT} breadcrumbs sent in ${totalTime}s`);
  console.log(`   ${POOL_SIZE} unique breadcrumb messages used across all events\n`);
  process.exit(0);
}

generateEvents().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
