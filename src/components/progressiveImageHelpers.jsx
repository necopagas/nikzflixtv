export const injectShimmerCSS = () => {
  if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
    const style = document.createElement('style');
    style.id = 'shimmer-styles';
    style.textContent = `@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} } .animate-shimmer { animation: shimmer 2s infinite; }`;
    document.head.appendChild(style);
  }
};

if (typeof window !== 'undefined') injectShimmerCSS();
