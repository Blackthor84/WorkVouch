import { BoardClient } from "./BoardClient";

export const dynamic = "force-dynamic";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <BoardClient />
    </div>
  );
}
