require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Bugsnag = require('@bugsnag/js');

const TOTAL_EVENTS = 500;
const BREADCRUMBS_PER_EVENT = 100;
const DELAY_MS = 100;
const LOG_INTERVAL = 50;

// --- Breadcrumb templates simulating a realistic ecomm user journey ---

const NAVIGATION_BREADCRUMBS = [
  { message: 'Navigated to: Home',             data: { page: 'home',     url: '/'}                                              },
  { message: 'Navigated to: Products',         data: { page: 'products', url: '/products', category: 'electronics' }            },
  { message: 'Navigated to: Product Detail',   data: { page: 'product_detail', productId: 'PROD_001', name: 'Wireless Mouse' } },
  { message: 'Navigated to: Cart',             data: { page: 'cart',     url: '/cart' }                                         },
  { message: 'Navigated to: Checkout',         data: { page: 'checkout', url: '/checkout' }                                     },
];

const USER_BREADCRUMBS = [
  { message: 'Action: search_performed',     data: { query: 'wireless mouse', resultsCount: 24 }           },
  { message: 'Action: filter_applied',       data: { filter: 'price', value: '0-1000' }                    },
  { message: 'Action: sort_changed',         data: { sort: 'price_asc' }                                   },
  { message: 'Action: add_to_cart',          data: { productId: 'PROD_001', quantity: 1, price: 499 }       },
  { message: 'Action: remove_from_cart',     data: { productId: 'PROD_002' }                                },
  { message: 'Action: quantity_updated',     data: { productId: 'PROD_001', newQuantity: 2 }                },
  { message: 'Action: coupon_applied',       data: { coupon: 'SAVE10', discount: 50 }                       },
  { message: 'Action: address_selected',     data: { addressId: 'ADDR_001', type: 'home' }                  },
  { message: 'Action: payment_method_selected', data: { method: 'card', last4: '[REDACTED]' }               },
  { message: 'Action: place_order_clicked',  data: { cartTotal: 998, itemsCount: 2 }                        },
  { message: 'Action: review_submitted',     data: { productId: 'PROD_001', rating: 4 }                     },
  { message: 'Action: wishlist_toggled',     data: { productId: 'PROD_003', added: true }                   },
  { message: 'Action: newsletter_signup',    data: { source: 'checkout_footer' }                            },
  { message: 'Action: tab_switched',         data: { from: 'description', to: 'reviews' }                  },
  { message: 'Action: image_gallery_swiped', data: { productId: 'PROD_001', index: 2 }                      },
];

const REQUEST_BREADCRUMBS = [
  { message: 'API: GET /products',            data: { method: 'GET',  path: '/api/products',            status: 200, duration: '142ms' } },
  { message: 'API: GET /products/:id',        data: { method: 'GET',  path: '/api/products/PROD_001',   status: 200, duration: '89ms'  } },
  { message: 'API: POST /cart',               data: { method: 'POST', path: '/api/cart',                status: 201, duration: '203ms' } },
  { message: 'API: GET /cart',                data: { method: 'GET',  path: '/api/cart',                status: 200, duration: '67ms'  } },
  { message: 'API: PUT /cart/:id',            data: { method: 'PUT',  path: '/api/cart/ITEM_001',       status: 200, duration: '134ms' } },
  { message: 'API: DELETE /cart/:id',         data: { method: 'DELETE', path: '/api/cart/ITEM_002',     status: 200, duration: '98ms'  } },
  { message: 'API: GET /auth/profile',        data: { method: 'GET',  path: '/api/auth/profile',        status: 200, duration: '55ms'  } },
  { message: 'API: GET /orders',              data: { method: 'GET',  path: '/api/orders',              status: 200, duration: '178ms' } },
  { message: 'API: POST /orders',             data: { method: 'POST', path: '/api/orders',              status: 201, duration: '456ms' } },
  { message: 'API: GET /orders/:id',          data: { method: 'GET',  path: '/api/orders/ORD_001',      status: 200, duration: '112ms' } },
  { message: 'API: GET /products?category=', data: { method: 'GET',  path: '/api/products?category=electronics', status: 200, duration: '220ms' } },
  { message: 'API: POST /auth/login',         data: { method: 'POST', path: '/api/auth/login',          status: 200, duration: '310ms' } },
  { message: 'API: POST /auth/logout',        data: { method: 'POST', path: '/api/auth/logout',         status: 200, duration: '45ms'  } },
  { message: 'API: PUT /auth/profile',        data: { method: 'PUT',  path: '/api/auth/profile',        status: 200, duration: '189ms' } },
  { message: 'API: GET /products/search',     data: { method: 'GET',  path: '/api/products/search',     status: 200, duration: '267ms' } },
];

const STATE_BREADCRUMBS = [
  { message: 'Cart Updated',        data: { itemsCount: 1, total: 499,  subtotal: 499,  tax: 24.95  } },
  { message: 'Cart Updated',        data: { itemsCount: 2, total: 998,  subtotal: 998,  tax: 49.90  } },
  { message: 'Cart Updated',        data: { itemsCount: 1, total: 499,  subtotal: 499,  tax: 24.95  } },
  { message: 'Auth State Changed',  data: { event: 'login',             userId: 'USR_001', role: 'customer' } },
  { message: 'Auth State Changed',  data: { event: 'token_refreshed',   userId: 'USR_001' }               },
  { message: 'Order Updated',       data: { orderId: 'ORD_001', status: 'pending',    total: 998  }        },
  { message: 'Order Updated',       data: { orderId: 'ORD_001', status: 'processing', total: 998  }        },
  { message: 'Order Updated',       data: { orderId: 'ORD_001', status: 'shipped',    total: 998  }        },
  { message: 'Viewed Product',      data: { productId: 'PROD_001', name: 'Wireless Mouse',  price: 499  }  },
  { message: 'Viewed Product',      data: { productId: 'PROD_002', name: 'USB Keyboard',    price: 799  }  },
  { message: 'Viewed Product',      data: { productId: 'PROD_003', name: 'HDMI Cable',       price: 199  }  },
  { message: 'Redux State Updated', data: { slice: 'cart',    action: 'addItem'    }                       },
  { message: 'Redux State Updated', data: { slice: 'auth',    action: 'setUser'    }                       },
  { message: 'Redux State Updated', data: { slice: 'cart',    action: 'removeItem' }                       },
  { message: 'Redux State Updated', data: { slice: 'orders',  action: 'setOrders'  }                       },
];

const LOG_BREADCRUMBS = [
  { message: 'Form validation passed',    data: { form: 'checkout',       fields: 5 }                },
  { message: 'Form validation failed',    data: { form: 'checkout',       field: 'phone', error: 'invalid format' } },
  { message: 'Address validation passed', data: { pincode: '560001',      city: 'Bangalore' }        },
  { message: 'Payment form rendered',     data: { method: 'card' }                                   },
  { message: 'Session initialized',       data: { sessionId: 'SES_001',   source: 'page_load' }      },
  { message: 'Feature flag checked',      data: { flag: 'new_checkout',   enabled: true }            },
  { message: 'Lazy component loaded',     data: { component: 'CheckoutPage' }                        },
  { message: 'Image load failed',         data: { src: '/images/PROD_003.jpg', fallback: true }      },
  { message: 'Cache hit',                 data: { key: 'products_page_1', age: '45s' }               },
  { message: 'Cache miss',                data: { key: 'products_page_3' }                           },
  { message: 'Retry attempted',           data: { attempt: 2, maxRetries: 3, api: '/api/orders' }    },
  { message: 'Debounce triggered',        data: { action: 'search_input', delay: '300ms' }           },
  { message: 'Component mounted',         data: { component: 'CartPage' }                            },
  { message: 'Component unmounted',       data: { component: 'ProductDetailPage' }                   },
  { message: 'LocalStorage read',         data: { key: 'user', found: true }                         },
];

const ERROR_BREADCRUMBS = [
  { message: 'Warning: Slow API response',       data: { path: '/api/orders',   duration: '2100ms', threshold: '2000ms' } },
  { message: 'Warning: Cart sync conflict',      data: { localCount: 2, serverCount: 1 }                                  },
  { message: 'Warning: Token expiring soon',     data: { expiresIn: '5min' }                                              },
  { message: 'Error: Payment gateway timeout',   data: { gateway: 'razorpay',   timeout: '30s' }                         },
  { message: 'Error: Address not serviceable',   data: { pincode: '999999' }                                              },
];

// Build a pool of 100 breadcrumbs by cycling through the 5 categories proportionally
function buildBreadcrumbPool() {
  const pool = [];

  // 5 navigation + 15 user + 30 request + 30 state + 15 log + 5 error = 100
  for (let i = 0; i < 5; i++)  pool.push({ ...NAVIGATION_BREADCRUMBS[i % NAVIGATION_BREADCRUMBS.length], type: 'navigation' });
  for (let i = 0; i < 15; i++) pool.push({ ...USER_BREADCRUMBS[i % USER_BREADCRUMBS.length],             type: 'user'       });
  for (let i = 0; i < 30; i++) pool.push({ ...REQUEST_BREADCRUMBS[i % REQUEST_BREADCRUMBS.length],       type: 'request'    });
  for (let i = 0; i < 30; i++) pool.push({ ...STATE_BREADCRUMBS[i % STATE_BREADCRUMBS.length],           type: 'state'      });
  for (let i = 0; i < 15; i++) pool.push({ ...LOG_BREADCRUMBS[i % LOG_BREADCRUMBS.length],               type: 'log'        });
  for (let i = 0; i < 5; i++)  pool.push({ ...ERROR_BREADCRUMBS[i % ERROR_BREADCRUMBS.length],           type: 'error'      });

  return pool;
}

const BREADCRUMB_POOL = buildBreadcrumbPool();

// --- Error scenarios to cycle through across 500 events ---

const ERROR_SCENARIOS = [
  { name: 'CheckoutError',        message: 'Payment processing failed during checkout',       severity: 'error'   },
  { name: 'CartSyncError',        message: 'Cart failed to sync with server',                 severity: 'warning' },
  { name: 'AuthTokenExpired',     message: 'JWT token expired mid-session',                   severity: 'warning' },
  { name: 'OrderCreationFailed',  message: 'Order could not be created — server rejected',    severity: 'error'   },
  { name: 'ProductLoadError',     message: 'Product detail page failed to load',              severity: 'warning' },
  { name: 'AddressValidationFail',message: 'Shipping address validation returned 422',        severity: 'error'   },
  { name: 'PaymentGatewayTimeout',message: 'Payment gateway timed out after 30s',             severity: 'error'   },
  { name: 'InventoryConflict',    message: 'Item went out of stock between cart and checkout',severity: 'error'   },
  { name: 'CouponExpired',        message: 'Applied coupon code is no longer valid',          severity: 'warning' },
  { name: 'SearchIndexError',     message: 'Search results failed to load',                   severity: 'warning' },
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
    apiKey: process.env.BUGSNAG_API_KEY,
    releaseStage: process.env.NODE_ENV || 'development',
    enabledReleaseStages: ['production', 'staging', 'development'],
    appVersion: process.env.APP_VERSION || '1.0.0',
    maxBreadcrumbs: 100,
    autoTrackSessions: false,
    logger: null,
  });

  console.log(`\n🚀 Starting generation of ${TOTAL_EVENTS} events × ${BREADCRUMBS_PER_EVENT} breadcrumbs\n`);
  const startTime = Date.now();

  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    const scenario = ERROR_SCENARIOS[(i - 1) % ERROR_SCENARIOS.length];

    // Leave exactly 100 breadcrumbs for this event — pushes out previous event's trail
    for (let b = 0; b < BREADCRUMBS_PER_EVENT; b++) {
      const crumb = BREADCRUMB_POOL[b];
      Bugsnag.leaveBreadcrumb(
        crumb.message,
        { ...crumb.data, eventIndex: i, breadcrumbIndex: b + 1 },
        crumb.type
      );
    }

    // Notify with a unique error for this event
    const error = new Error(`[Event ${i}/${TOTAL_EVENTS}] ${scenario.message}`);
    error.name = scenario.name;

    await new Promise((resolve) => {
      Bugsnag.notify(error, (event) => {
        event.severity = scenario.severity;
        event.context = `generate-events-script`;
        event.addMetadata('generator', {
          eventIndex:       i,
          totalEvents:      TOTAL_EVENTS,
          breadcrumbCount:  BREADCRUMBS_PER_EVENT,
          scenario:         scenario.name,
          generatedAt:      new Date().toISOString(),
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
  console.log(`\n✅ Done — ${TOTAL_EVENTS} events × ${BREADCRUMBS_PER_EVENT} breadcrumbs sent in ${totalTime}s\n`);
  process.exit(0);
}

generateEvents().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
