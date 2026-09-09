// Pi SDK TypeScript declarations
declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => void;
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: any) => void) => Promise<{
        accessToken: string;
        user: {
          uid: string;
          username?: string;
          wallet_address?: string;
        };
      }>;
      createPayment: (paymentData: any, callbacks: any) => void;
    };
  }
}

export {};
