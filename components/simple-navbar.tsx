import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow">
      <Link href="/" className="flex items-center">
        <Image
          src="/images/workvouch-logo.png.png"
          alt="WorkVouch Logo"
          width={200}
          height={50}
          priority
        />
      </Link>
      <div className="flex space-x-4">
        <Link href="/pricing">Pricing</Link>
        <Link href="/auth/signup">Sign Up</Link>
        <Link href="/auth/signin">Login</Link>
      </div>
    </nav>
  );
}
