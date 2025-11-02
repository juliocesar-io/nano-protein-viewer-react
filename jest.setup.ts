import '@testing-library/jest-dom';

// Silence noisy React act() warnings in tests where we drive async state updates intentionally
const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('not wrapped in act')) return;
  originalError(...args);
};


