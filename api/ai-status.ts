// AI service availability and configuration status endpoint.

/**
 * Handles GET requests to check whether server-side AI key is configured.
 *
 * @returns JSON response indicating configuration status.
 */
export async function GET(): Promise<Response> {
  const configured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

  return new Response(JSON.stringify({ configured }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
