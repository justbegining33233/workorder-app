import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url: string, init?: RequestInit) {
      return {
        url,
        method: init?.method || 'GET',
        headers: new Headers(init?.headers),
        json: async () => init?.body || {},
        text: async () => '',
        clone: () => this,
        ...init
      };
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers),
    }),
    redirect: (url: string, init?: ResponseInit) => ({
      status: init?.status || 302,
      headers: new Headers({ Location: url, ...init?.headers }),
    }),
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  default: {
    workOrder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

// Mock Web APIs
global.Request = class MockRequest {
  constructor(url: string, init?: RequestInit) {
    return {
      url,
      method: init?.method || 'GET',
      headers: new Headers(init?.headers),
      json: async () => init?.body || {},
      text: async () => '',
      clone: () => this,
      ...init
    };
  }
} as any;

global.Response = class MockResponse {
  constructor(body?: any, init?: ResponseInit) {
    return {
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
      headers: new Headers(init?.headers),
      json: async () => body,
      text: async () => JSON.stringify(body),
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      ...init
    };
  }
} as any;

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};