import { useSearchParams } from 'next/navigation'

export default function useParams() {
	const searchParams = useSearchParams()
	const followersOf = searchParams.get('followersOf') ?? ''
	const followedBy = searchParams.get('followedBy') ?? ''

	return { followersOf, followedBy }
}
