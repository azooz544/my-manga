/**
 * Direct tRPC client caller for async functions
 * This allows calling tRPC procedures from non-React contexts
 */

import superjson from 'superjson';

const API_BASE = '/api/trpc';

interface TRPCResponse<T> {
  result: {
    data: T;
  };
}

async function callTRPCProcedure<T>(
  procedurePath: string,
  input: unknown
): Promise<T> {
  try {
    const inputJson = superjson.stringify(input);
    const url = `${API_BASE}/${procedurePath}?input=${encodeURIComponent(inputJson)}`;
    
    console.log(`[tRPCClient] Calling: ${procedurePath}`, { input });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as TRPCResponse<T>;
    
    if (!data.result) {
      throw new Error('Invalid tRPC response format');
    }

    console.log(`[tRPCClient] Success:`, data.result.data);
    return data.result.data;
  } catch (error: any) {
    console.error(`[tRPCClient] Error calling ${procedurePath}:`, error);
    throw error;
  }
}

export const trpcClient = {
  manga: {
    search: (title: string) => callTRPCProcedure<any[]>('manga.search', title),
    getChapters: (malId: string) => callTRPCProcedure<any[]>('manga.getChapters', malId),
    getChapterImages: (chapterId: string) =>
      callTRPCProcedure<string[]>('manga.getChapterImages', chapterId),
  },
};
