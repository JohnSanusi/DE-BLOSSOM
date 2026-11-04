import { redirect } from 'next/navigation'
import { getMemberPortalData } from '@/lib/queries/portal'
import MemberPortalClient, { type MemberPortalData, type MemberSection } from './member-portal'

export default async function CooperativePortal({ section = 'overview' }: { section?: MemberSection }) {
  const data = await getMemberPortalData()

  if (!data || !data.profile) {
    redirect('/sign-in')
  }

  return <MemberPortalClient data={data as MemberPortalData} section={section} />
}
