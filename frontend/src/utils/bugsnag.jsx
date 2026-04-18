import Bugsnag from '@bugsnag/browser';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session and Metadata Management for Bugsnag (Frontend)
 * Handles user context, session tracking, breadcrumbs, and error notification
 */

class BugsnagManager {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userId = null;
    this.currentFlow = null;
    this.isInitialized = false;
    this.sensitivePatterns = {
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      apiKey: /api[_-]?key[=:]\s*["']?[\w-]{20,}["']?/gi,
      password: /password[=:]\s*["']?[^"'\s]+["']?/gi,
      authToken: /auth[_-]?token[=:]\s*["']?[^"'\s]+["']?/gi,
      bearerToken: /bearer\s+[a-z0-9\-._~+/]+=*/gi,
    };
  }

  /**
   * Get existing session ID or create new one
   * @returns {string} Session ID
   */
  getOrCreateSessionId() {
    const stored = sessionStorage.getItem('bugsnag_session_id');
    if (stored) return stored;

    const newSessionId = uuidv4();
    sessionStorage.setItem('bugsnag_session_id', newSessionId);
    return newSessionId;
  }

  /**
   * Initialize Bugsnag (called once at app startup)
   * @returns {boolean} Success status
   */
  initialize() {
    if (!import.meta.env.VITE_BUGSNAG_API_KEY) {
      console.log('⚠️  Bugsnag API key not set. Error reporting disabled.');
      return false;
    }

    this.isInitialized = true;

    // Set default user (anonymous user with session ID)
    this.userId = this.userId || `anonymous_${this.sessionId}`;
    this.setUser(this.userId);

    // Initialize session in Bugsnag context
    this.attachMetadata({
      sessionId: this.sessionId,
      userId: this.userId,
      flowStage: 'app_initialized',
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    return true;
  }

  /**
   * Set user for tracking
   * @param {string} userId - Unique user ID
   * @param {string} userName - Display name (optional)
   * @param {string} userEmail - Email address (optional, will be masked)
   */
  setUser(userId, userName = null, userEmail = null) {
    this.userId = userId;

    if (!this.isInitialized) return;

    const user = {
      id: userId,
      name: userName,
      email: userEmail ? this.maskSensitiveData(userEmail) : undefined,
    };

    Bugsnag.setUser(userId, userName, userEmail ? '[REDACTED]' : undefined);
  }

  /**
   * Mask sensitive data in strings
   * @param {string} value - The value to mask
   * @returns {string} - Masked value
   */
  maskSensitiveData(value) {
    if (typeof value !== 'string') return value;

    let masked = value;
    Object.entries(this.sensitivePatterns).forEach(([key, pattern]) => {
      masked = masked.replace(pattern, `[${key.toUpperCase()}_REDACTED]`);
    });
    return masked;
  }

  /**
   * Recursively mask sensitive fields in objects
   * @param {object} obj - Object to mask
   * @param {array} sensitiveFields - Field names to mask
   * @returns {object} - Object with masked fields
   */
  maskSensitiveFields(obj, sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'creditCard',
    'cvv',
    'ssn',
    'email',
    'phone',
    'cardNumber',
  ]) {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = Array.isArray(obj) ? [...obj] : { ...obj };
    
    Object.keys(masked).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveFields(masked[key], sensitiveFields);
      } else if (typeof masked[key] === 'string') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    });
    
    return masked;
  }

  /**
   * Set flow context (e.g., "login", "checkout", "payment")
   * @param {string} flowName - Name of current flow
   */
  setFlowContext(flowName) {
    this.currentFlow = flowName;
    this.leaveBreadcrumb(`Flow: ${flowName}`, {
      flowStage: flowName,
      timestamp: new Date().toISOString(),
    }, 'navigation');
  }

  /**
   * Attach custom metadata to error context
   * @param {object} metadata - Object containing metadata
   */
  attachMetadata(metadata) {
    if (!this.isInitialized) return;

    const maskedMetadata = this.maskSensitiveFields(metadata);
    
    Bugsnag.addOnError((event) => {
      event.addMetadata('customContext', {
        ...maskedMetadata,
        sessionId: this.sessionId,
        userId: this.userId,
        flowStage: this.currentFlow,
        timestamp: new Date().toISOString(),
      });
    }, true);
  }

  /**
   * Leave a breadcrumb for user action tracking
   * @param {string} message - Breadcrumb message
   * @param {object} data - Additional metadata
   * @param {string} type - Breadcrumb type (user, request, error, state, navigation, log, etc.)
   */
  leaveBreadcrumb(message, data = {}, type = 'user') {
    if (!this.isInitialized) return;

    const maskedData = this.maskSensitiveFields(data);
    Bugsnag.leaveBreadcrumb(message, maskedData, type);
  }

  /**
   * Track page navigation
   * @param {string} pageName - Page name (e.g., 'home', 'products', 'checkout')
   * @param {object} routeParams - Route parameters
   */
  trackPageNavigation(pageName, routeParams = {}) {
    const navigationData = {
      page: pageName,
      url: window.location.href,
      ...this.maskSensitiveFields(routeParams),
    };

    this.leaveBreadcrumb(`Navigated to: ${pageName}`, navigationData, 'navigation');
  }

  /**
   * Track button/action click
   * @param {string} actionName - Name of action (e.g., 'add_to_cart', 'checkout')
   * @param {object} actionData - Action-specific data
   */
  trackActionClick(actionName, actionData = {}) {
    const clickData = {
      action: actionName,
      ...this.maskSensitiveFields(actionData),
    };

    this.leaveBreadcrumb(`Action: ${actionName}`, clickData, 'user');
  }

  /**
   * Track API call
   * @param {string} method - HTTP method
   * @param {string} path - API endpoint path
   * @param {object} payload - Request payload (will be masked)
   * @param {number} responseStatus - HTTP response status
   * @param {number} duration - Request duration in ms
   */
  trackAPICall(method, path, payload = null, responseStatus = null, duration = null) {
    const apiData = {
      method,
      path,
      status: responseStatus,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (payload && Object.keys(payload).length > 0) {
      apiData.payload = this.maskSensitiveFields(payload);
    }

    this.leaveBreadcrumb(
      `API: ${method} ${path}`,
      apiData,
      'request'
    );
  }

  /**
   * Track cart state update
   * @param {object} cart - Cart object
   */
  trackCartUpdate(cart) {
    const cartData = {
      itemsCount: cart?.items?.length || 0,
      total: cart?.total,
      subtotal: cart?.subtotal,
      taxAmount: cart?.tax,
    };

    if (cart?.items) {
      cartData.items = cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    this.leaveBreadcrumb('Cart Updated', cartData, 'state');
  }

  /**
   * Track product view
   * @param {object} product - Product object
   */
  trackProductView(product) {
    const productData = {
      productId: product?.id,
      name: product?.name,
      category: product?.category,
      price: product?.price,
      rating: product?.rating,
    };

    this.leaveBreadcrumb('Viewed Product', productData, 'state');
  }

  /**
   * Track search action
   * @param {string} searchQuery - Search query
   * @param {number} resultsCount - Number of results
   */
  trackSearch(searchQuery, resultsCount = null) {
    const searchData = {
      query: searchQuery,
      resultsCount,
    };

    this.leaveBreadcrumb('Search Performed', searchData, 'user');
  }

  /**
   * Track order operation
   * @param {object} order - Order object
   */
  trackOrderUpdate(order) {
    const orderData = {
      orderId: order?.id,
      status: order?.status,
      total: order?.total,
      itemsCount: order?.items?.length || 0,
      paymentMethod: order?.paymentMethod ? '[REDACTED]' : undefined,
    };

    this.leaveBreadcrumb('Order Updated', orderData, 'state');
  }

  /**
   * Track form submission
   * @param {string} formName - Name of form
   * @param {object} formData - Form data (will be masked)
   */
  trackFormSubmit(formName, formData = {}) {
    const submitData = {
      form: formName,
      fields: this.maskSensitiveFields(formData),
    };

    this.leaveBreadcrumb(`Form Submitted: ${formName}`, submitData, 'user');
  }

  /**
   * Notify Bugsnag with full context
   * @param {Error} error - Error object
   * @param {string} errorType - Type of error
   * @param {object} additionalContext - Additional context data
   */
  notifyError(error, errorType = 'error', additionalContext = {}) {
    if (!this.isInitialized) {
      console.error('Bugsnag not initialized:', error);
      return;
    }

    const context = {
      errorType,
      sessionId: this.sessionId,
      userId: this.userId,
      flowStage: this.currentFlow,
      url: window.location.href,
      ...this.maskSensitiveFields(additionalContext),
    };

    Bugsnag.notify(error, (event) => {
      event.addMetadata('errorContext', context);
      event.context = this.currentFlow || 'unknown';
      event.severity = errorType === 'critical' ? 'error' : 'warning';
    });
  }

  /**
   * Wrap API calls with automatic tracking
   * @param {Function} apiFunction - Async function making API call
   * @param {string} apiName - Name of API call
   * @param {object} options - Additional options
   * @returns {Promise}
   */
  async trackAPIFunction(apiFunction, apiName, options = {}) {
    const startTime = Date.now();
    try {
      const result = await apiFunction();
      const duration = Date.now() - startTime;
      
      this.trackAPICall(
        options.method || 'GET',
        options.path || apiName,
        options.payload,
        200,
        duration
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.trackAPICall(
        options.method || 'GET',
        options.path || apiName,
        options.payload,
        error.response?.status || 'unknown',
        duration
      );
      
      this.notifyError(error, 'api_error', {
        apiName,
        ...options,
      });
      
      throw error;
    }
  }
}

// Export singleton instance
export default new BugsnagManager();
