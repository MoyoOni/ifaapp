declare module 'flutterwave-node-v3' {
  class Flutterwave {
    constructor(publicKey: string, secretKey: string, isLive?: boolean);

    // Payment methods
    Payment: {
      card(payload: any): Promise<any>;
      mpesa(payload: any): Promise<any>;
      ghmobile(payload: any): Promise<any>;
      ugmobile(payload: any): Promise<any>;
      zmmpesa(payload: any): Promise<any>;
      rwmobile(payload: any): Promise<any>;
      bank_transfer(payload: any): Promise<any>;
      ussd(payload: any): Promise<any>;
      barter(payload: any): Promise<any>;
      credit(payload: any): Promise<any>;
      validate(transaction_id: string, otp: string): Promise<any>;
      verify(transaction_id: string): Promise<any>;
    };

    // Transaction methods
    // Checked against the installed SDK (1.4.1) on October 30, 2026: it has
    // no `Payment` or `Refund` objects; verification and refunds live here.
    Transaction: {
      verify(payload: { id: string | number }): Promise<any>;
      verify_by_tx(payload: { tx_ref: string }): Promise<any>;
      refund(payload: { id: string | number; amount?: number }): Promise<any>;
      fetch(payload?: Record<string, unknown>): Promise<any>;
    };

    // Transfer methods
    Transfer: {
      initiate(payload: any): Promise<any>;
      bulk(payload: any): Promise<any>;
      get(transfer_id: string): Promise<any>;
      getAll(): Promise<any>;
      getFee(currency: string): Promise<any>;
      getBalance(currency?: string): Promise<any>;
    };

    // Subaccount methods
    Subaccount: {
      create(payload: any): Promise<any>;
      get(subaccount_id: string): Promise<any>;
      getAll(): Promise<any>;
      update(subaccount_id: string, payload: any): Promise<any>;
    };

    // Plan methods
    Plan: {
      create(payload: any): Promise<any>;
      get(plan_id: string): Promise<any>;
      getAll(): Promise<any>;
      update(plan_id: string, payload: any): Promise<any>;
    };

    // Subscription methods
    Subscription: {
      activate(subscription_id: string): Promise<any>;
      cancel(subscription_id: string): Promise<any>;
      get(subscription_id: string): Promise<any>;
      getAll(): Promise<any>;
    };
  }

  export default Flutterwave;
}
