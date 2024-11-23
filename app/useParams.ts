import { useSearchParams } from 'next/navigation'

export default function useParams() {
	const searchParams = useSearchParams()
	const followersOf = searchParams.get('followersOf')?.toLowerCase() ?? ''
	const followedBy = searchParams.get('followedBy')?.toLowerCase() ?? ''

	return { followersOf, followedBy }
}
