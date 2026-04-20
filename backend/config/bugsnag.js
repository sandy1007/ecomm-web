const Bugsnag = require('@bugsnag/js');
const BugsnagPluginExpress = require('@bugsnag/plugin-express');

const initializeBugsnag = () => {
  // Only initialize if API key is provided
  if (!process.env.BUGSNAG_API_KEY) {
    console.log('⚠️  Bugsnag API key not set. Error reporting disabled.');
    return null;
  }

  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY,
    releaseStage: process.env.NODE_ENV || 'development',
    enabledReleaseStages: ['production', 'staging', 'development'],
    appVersion: process.env.APP_VERSION || '1.0.0',
    plugins: [BugsnagPluginExpress],
    autoTrackSessions: true,
    maxBreadcrumbs: 100,
  });

  console.log('✅ Bugsnag initialized successfully');
  return Bugsnag;
};

const getBugsnagMiddleware = () => {
  if (!process.env.BUGSNAG_API_KEY) {
    // Return no-op middleware if Bugsnag is not initialized
    return {
      requestHandler: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err),
    };
  }
  
  const middleware = Bugsnag.getPlugin('express');
  if (!middleware) {
    throw new Error('Bugsnag Express plugin not initialized');
  }
  return middleware;
};

module.exports = { initializeBugsnag, getBugsnagMiddleware };

