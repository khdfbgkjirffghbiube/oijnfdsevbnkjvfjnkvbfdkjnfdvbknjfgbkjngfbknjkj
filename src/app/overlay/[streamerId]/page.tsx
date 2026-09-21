import OverlayClient from "./OverlayClient";

export default async function OverlayPage({ params }: { params: Promise<{ streamerId: string }> }) {
  const { streamerId } = await params;
  return <OverlayClient streamerId={streamerId} />;
}

