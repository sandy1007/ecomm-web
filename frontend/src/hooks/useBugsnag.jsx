import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import bugsnagManager from '../utils/bugsnag.jsx';

/**
 * Hook to track page navigation
 * Automatically tracks when user navigates to different pages
 */
export const useBugsnagPageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Extract page name from location
    const pageName = location.pathname.split('/').filter(Boolean)[0] || 'home';
    bugsnagManager.trackPageNavigation(pageName, {
      path: location.pathname,
      search: location.search,
    });
  }, [location]);
};

/**
 * Hook to track button clicks with context
 * Returns a wrapped onClick handler that tracks the action
 * @param {string} actionName - Name of the action
 * @returns {Function} Wrapped click handler
 */
export const useBugsnagActionTracking = (actionName) => {
  return (actionData = {}) => {
    bugsnagManager.trackActionClick(actionName, actionData);
  };
};

/**
 * Hook to track cart updates
 * @param {object} cart - Cart state
 */
export const useBugsnagCartTracking = (cart) => {
  useEffect(() => {
    if (cart && Object.keys(cart).length > 0) {
      bugsnagManager.trackCartUpdate(cart);
    }
  }, [cart]);
};

/**
 * Hook to track product views
 * @param {object} product - Product object
 */
export const useBugsnagProductTracking = (product) => {
  useEffect(() => {
    if (product && product.id) {
      bugsnagManager.trackProductView(product);
    }
  }, [product?.id]);
};

/**
 * Hook to track form submissions
 * @param {string} formName - Name of the form
 * @returns {Function} Handler to track form submission
 */
export const useBugsnagFormTracking = (formName) => {
  return (formData = {}) => {
    bugsnagManager.trackFormSubmit(formName, formData);
  };
};

/**
 * Hook to set flow context
 * @param {string} flowName - Name of the flow
 */
export const useBugsnagFlowContext = (flowName) => {
  useEffect(() => {
    bugsnagManager.setFlowContext(flowName);
  }, [flowName]);
};

/**
 * Hook to set user information
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {string} userEmail - User email
 */
export const useBugsnagUserTracking = (userId, userName = null, userEmail = null) => {
  useEffect(() => {
    if (userId) {
      bugsnagManager.setUser(userId, userName, userEmail);
    }
  }, [userId, userName, userEmail]);
};

/**
 * Hook to track errors that occur in a component
 * Wraps the component with error tracking
 * @param {Function} handler - Error handler function
 */
export const useBugsnagErrorTracking = (handler = null) => {
  const trackError = (error, errorType = 'error', context = {}) => {
    bugsnagManager.notifyError(error, errorType, context);
    if (handler) {
      handler(error);
    }
  };

  return trackError;
};

export default {
  useBugsnagPageTracking,
  useBugsnagActionTracking,
  useBugsnagCartTracking,
  useBugsnagProductTracking,
  useBugsnagFormTracking,
  useBugsnagFlowContext,
  useBugsnagUserTracking,
  useBugsnagErrorTracking,
};
