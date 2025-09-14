// Type definitions for Deno runtime in Supabase Edge Functions

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare const serve: (handler: (req: Request) => Response | Promise<Response>) => void;

export {};
