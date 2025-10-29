// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
export const runtime = "nodejs"
export default async function middleware(req: NextRequest) {
    
  const session = await auth();
  const { pathname, search } = req.nextUrl;

  // 1) Página de login:
  // - Sem sessão: permitir
  // - Com sessão: redirecionar para /home
  if (pathname === "/login") {
    if (session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      url.search = ""; // limpar query ao redirecionar
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2) Demais páginas:
  // - Sem sessão: redirecionar para /login (opcionalmente com callbackUrl)
  // - Com sessão: permitir
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // Opcional: manter callback de retorno
    // url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Inclui /login e páginas; exclui estáticos e APIs.
// Ajuste a lista de exclusões conforme necessidade (ex.: /public, /uploads, etc.).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets|images|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)|api/).*)",
  ],
};
