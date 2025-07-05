
declare global {
    interface Window {
      dataLayer: any[];
      gtag: (...args: any[]) => void;
    }
}

let isInitialized = false;

// Function to initialize Google Analytics
export function init(measurementId: string): void {
  if (isInitialized || !measurementId.trim() || !measurementId.startsWith('G-')) {
    return;
  }
  
  // Create script element
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;

  // Add script to head
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]){
    window.dataLayer.push(args);
  }
  // Make gtag globally available
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId);

  isInitialized = true;
  console.log("Google Analytics Initialized with ID:", measurementId);
}

// Function to track page views
export function trackPageView(path: string): void {
  if (!isInitialized || !window.gtag) {
    return;
  }
  window.gtag('event', 'page_view', {
    page_path: path,
  });
}

// Function to track custom events
export function trackEvent(eventName: string, params?: object): void {
  if (!isInitialized || !window.gtag) {
    return;
  }
  window.gtag('event', eventName, params);
}