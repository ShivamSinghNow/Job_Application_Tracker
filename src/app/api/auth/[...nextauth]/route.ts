import { handlers } from "@/lib/auth";

// Wrap the handlers to handle CSRF issues in proxy environments (v0 sandbox)
export const GET = handlers.GET;

export async function POST(request: Request) {
  // Clone the request and add the origin header to match forwarded host
  // This fixes CSRF validation in proxy environments
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const url = new URL(request.url);
    const newHeaders = new Headers(request.headers);
    newHeaders.set("origin", `https://${forwardedHost}`);
    
    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      duplex: "half",
    } as RequestInit);
    
    return handlers.POST(modifiedRequest);
  }
  
  return handlers.POST(request);
}
