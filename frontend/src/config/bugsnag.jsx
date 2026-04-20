import React from 'react';
import Bugsnag from '@bugsnag/browser';
import BugsnagPluginReact from '@bugsnag/plugin-react';

const initializeBugsnag = () => {
  // Only initialize if API key is provided
  if (!import.meta.env.VITE_BUGSNAG_API_KEY) {
    console.log('⚠️  Bugsnag API key not set. Error reporting disabled.');
    return;
  }

  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    releaseStage: import.meta.env.VITE_NODE_ENV || 'development',
    enabledReleaseStages: ['production', 'staging', 'development'],
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    plugins: [new BugsnagPluginReact(React)],
    autoTrackSessions: true,
  });

  console.log('✅ Bugsnag initialized successfully');
};

export const getErrorBoundary = () => {
  // Return null if Bugsnag is not initialized
  if (!import.meta.env.VITE_BUGSNAG_API_KEY) {
    return ({ children }) => <>{children}</>;
  }
  
  const plugin = Bugsnag.getPlugin('react');
  if (!plugin) {
    return ({ children }) => <>{children}</>;
  }
  return plugin.createErrorBoundary();
};

export default initializeBugsnag;

