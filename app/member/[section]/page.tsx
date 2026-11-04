import { notFound } from 'next/navigation'
import CooperativePortal from '@/components/cooperative-portal'
import type { MemberSection } from '@/components/member-portal'

const sections: MemberSection[] = ['overview', 'accounts', 'payment', 'history', 'loans', 'profile']

export default async function MemberSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section as MemberSection)) notFound()
  return <CooperativePortal section={section as MemberSection} />
}
