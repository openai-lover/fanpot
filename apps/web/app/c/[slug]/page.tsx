import { notFound } from 'next/navigation';
import { CampaignPreview } from '../../../components/shell';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== 'lumi-birthday-lights-demo') notFound();
  return <CampaignPreview/>;
}
