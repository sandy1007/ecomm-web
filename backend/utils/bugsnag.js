const Bugsnag = require('@bugsnag/js');

/**
 * Session and Metadata Management for Bugsnag
 * Handles user context, session tracking, breadcrumbs, and error notification
 */

class BugsnagManager {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.currentFlow = null;
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
   * Initialize session context
   * @param {string} userId - Unique user identifier
   * @param {string} sessionId - Unique session identifier
   */
  initializeSession(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;

    const client = Bugsnag.start ? Bugsnag : null;
    if (!client || !process.env.BUGSNAG_API_KEY) {
      return;
    }

    Bugsnag.setUser(userId, userId, userId);
    this.attachMetadata({
      sessionId,
      userId,
      flowStage: 'initialized',
    });
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
  ]) {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = { ...obj };
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
    this.leaveBreadcrumb(`flow:${flowName}`, {
      flowStage: flowName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Attach custom metadata to error context
   * @param {object} metadata - Object containing metadata
   */
  attachMetadata(metadata) {
    const client = Bugsnag.start ? Bugsnag : null;
    if (!client || !process.env.BUGSNAG_API_KEY) {
      return;
    }

    const maskedMetadata = this.maskSensitiveFields(metadata);

    Bugsnag.addOnError((event) => {
      event.addMetadata('customContext', {
        ...maskedMetadata,
        sessionId: this.sessionId,
        userId: this.userId,
        flowStage: this.currentFlow,
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
    const client = Bugsnag.start ? Bugsnag : null;
    if (!client || !process.env.BUGSNAG_API_KEY) {
      return;
    }

    const maskedData = this.maskSensitiveFields(data);
    Bugsnag.leaveBreadcrumb(message, maskedData, type);
  }

  /**
   * Track API request
   * @param {string} method - HTTP method
   * @param {string} path - API endpoint path
   * @param {object} query - Query parameters
   * @param {number} responseStatus - HTTP response status
   * @param {number} duration - Request duration in ms
   */
  trackAPIRequest(method, path, query = {}, responseStatus = null, duration = null) {
    const breadcrumbData = {
      method,
      path,
      status: responseStatus,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (Object.keys(query).length > 0) {
      breadcrumbData.query = this.maskSensitiveFields(query);
    }

    this.leaveBreadcrumb(
      `${method} ${path}`,
      breadcrumbData,
      'request'
    );
  }

  /**
   * Track cart operation
   * @param {object} cart - Cart object or state
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
        quantity: item.quantity,
        price: item.price,
      }));
    }

    this.leaveBreadcrumb('cart:updated', cartData, 'state');
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

    this.leaveBreadcrumb('order:updated', orderData, 'state');
  }

  /**
   * Notify Bugsnag with full context
   * @param {Error} error - Error object
   * @param {string} errorType - Type of error (e.g., 'api', 'validation', 'database')
   * @param {object} additionalContext - Additional context data
   */
  notifyError(error, errorType = 'error', additionalContext = {}) {
    const client = Bugsnag.start ? Bugsnag : null;
    if (!client || !process.env.BUGSNAG_API_KEY) {
      console.error('Bugsnag not initialized:', error);
      return;
    }

    const context = {
      errorType,
      sessionId: this.sessionId,
      userId: this.userId,
      flowStage: this.currentFlow,
      ...this.maskSensitiveFields(additionalContext),
    };

    Bugsnag.notify(error, (event) => {
      event.addMetadata('errorContext', context);
      event.context = this.currentFlow || 'unknown';
    });
  }

  /**
   * Create request tracking middleware
   * @returns {Function} Express middleware
   */
  createRequestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Store original send
      const originalSend = res.send;

      res.send = function (data) {
        const duration = Date.now() - startTime;

        // Track successful requests
        if (res.statusCode < 400) {
          this.trackAPIRequest(
            req.method,
            req.path,
            req.query,
            res.statusCode,
            duration
          );
        }

        // Call original send
        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Create error tracking middleware
   * @returns {Function} Express error middleware
   */
  createErrorMiddleware() {
    return (err, req, res, next) => {
      const duration = req.startTime ? Date.now() - req.startTime : null;

      this.notifyError(err, 'api_error', {
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode: res.statusCode,
        duration,
      });

      next(err);
    };
  }
}

// Export singleton instance
module.exports = new BugsnagManager();
