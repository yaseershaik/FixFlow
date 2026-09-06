export function GET() {
  return new Response("google-site-verification: google27120dac95c51513.html", {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
