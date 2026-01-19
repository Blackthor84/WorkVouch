import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      type: 'user' | 'employer' | 'admin'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    type: 'user' | 'employer' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    type: 'user' | 'employer' | 'admin'
  }
}
