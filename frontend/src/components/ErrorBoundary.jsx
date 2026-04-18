import { getErrorBoundary } from '../config/bugsnag.jsx';

// Lazily resolved after Bugsnag.start() runs in main.jsx
let CachedBoundary = null;

export default function ErrorBoundary({ children }) {
  if (!CachedBoundary) {
    CachedBoundary = getErrorBoundary();
  }
  const Boundary = CachedBoundary;
  return <Boundary>{children}</Boundary>;
}
