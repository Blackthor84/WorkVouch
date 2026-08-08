import { UserMessages } from "@/components/messages/user-messages";
import { WvContainer, WvPageHeader } from "@/components/wv";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  return (
    <WvContainer className="py-8">
      <WvPageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Your conversations and notifications."
      />
      <UserMessages />
    </WvContainer>
  );
}
