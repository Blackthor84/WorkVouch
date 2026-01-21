import { NavbarServer } from '@/components/navbar-server'

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavbarServer />
      {children}
    </>
  )
}
