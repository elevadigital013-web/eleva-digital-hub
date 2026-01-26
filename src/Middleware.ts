import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Verifica se o usuário está logado
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()

  // 1. Proteger rotas de ADMIN
  if (url.pathname.startsWith('/admin')) {
    if (!session) {
      url.pathname = '/' // Se não estiver logado, vai para o login
      return NextResponse.redirect(url)
    }

    // Busca o perfil para ver se é realmente admin
    // Aqui assumimos que o seu ID de admin é o que você usa
    // Ou você pode checar na tabela vendedores se o campo 'is_admin' existe
    const { data: profile } = await supabase
      .from('vendedores')
      .select('email')
      .eq('id', session.user.id)
      .single()

    // Se o e-mail não for o seu de admin, bloqueia
    // DICA: Substitua 'seu-email@admin.com' pelo seu e-mail real do Supabase
    if (profile?.email !== 'admin@elevadigital.com') {
      url.pathname = '/vendedor/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // 2. Proteger rotas de VENDEDOR
  if (url.pathname.startsWith('/vendedor')) {
    if (!session) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return res
}

// Configura em quais caminhos o middleware vai atuar
export const config = {
  matcher: ['/admin/:path*', '/vendedor/:path*'],
}