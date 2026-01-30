import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      roles?: string[];
    };
    impersonating?: boolean;
    originalAdminId?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    roles?: string[];
    email: string;
    impersonating?: boolean;
    originalAdminId?: string;
    originalAdminRoles?: string[];
  }
}
