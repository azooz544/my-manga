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
    // Use superjson to properly serialize the input
    const serialized = superjson.stringify(input);
    const url = `${API_BASE}/${procedurePath}?input=${encodeURIComponent(serialized)}`;
    
    console.log(`[tRPCClient] Calling: ${procedurePath}`, { input, url });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[tRPCClient] Error response:`, errorText);
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const responseText = await response.text();
    console.log(`[tRPCClient] Raw response:`, responseText);
    
    const data = JSON.parse(responseText) as TRPCResponse<any>;
    
    if (!data.result) {
      throw new Error('Invalid tRPC response format: ' + JSON.stringify(data));
    }

    // Deserialize the response using superjson
    const deserializedData = superjson.deserialize(data.result.data) as T;
    
    console.log(`[tRPCClient] Deserialized data:`, deserializedData);
    console.log(`[tRPCClient] Success:`, deserializedData);
    return deserializedData;
  } catch (error: any) {
    console.error(`[tRPCClient] Error calling ${procedurePath}:`, error);
    throw error;
  }
}

export const trpcClient = {
  manga: {
    getAll: (input?: { type?: string }) => callTRPCProcedure<any[]>('manga.getAll', input || {}),
    search: (title: string) => callTRPCProcedure<any[]>('manga.search', title),
    getChapters: (mangaId: string) => callTRPCProcedure<any[]>('manga.getChapters', mangaId),
    getChapterImages: (chapterId: string) =>
      callTRPCProcedure<string[]>('manga.getChapterImages', chapterId),
  },
};
