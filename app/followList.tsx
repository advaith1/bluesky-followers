'use client'

import { useEffect, useMemo, useState } from 'react'
import { bsky } from './bsky'
import UserDisplay from './user'
import { compactFormatter, fullFormatter } from './numberFormatter'
import styles from './followList.module.css'
import useParams from './useParams'
import type { ProfileView, User } from './types'

/** Removes extraneous fields from a ProfileView to save memory */
function simplifyUser(user: ProfileView): User {
	return {
		avatar: user.avatar,
		did: user.did,
		displayName: user.displayName,
		handle: user.handle
	}
}

export default function FollowList() {
	const { followersOf, followedBy } = useParams()

	if (followersOf || followedBy) {
		return <BaseFollowList followersOf={followersOf} followedBy={followedBy} />
	} else {
		return <HomeText />
	}
}

export function HomeText() {
	return <p className={styles.homeText}>Enter handles to search!</p>
}

function BaseFollowList({ followersOf, followedBy }: { followersOf: string; followedBy: string }) {
	const [followerCount, setFollowerCount] = useState(0)
	const [followCount, setFollowCount] = useState(0)
	const [followers, setFollowers] = useState<User[]>([])
	const [completedFetchingFollowers, setCompletedFetchingFollowers] = useState(false)
	const [follows, setFollows] = useState<User[]>([])
	const [completedFetchingFollows, setCompletedFetchingFollows] = useState(false)
	const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({})
	const [errors, setErrors] = useState<string[]>([])

	function processError(e: unknown) {
		const error = e as Error
		const cause = error.cause as Error | undefined
		if (error.name !== 'AbortError' && cause?.name !== 'AbortError') setErrors(prev => [...prev, error.message])
	}

	// fetch each user's follower count, for the progress bar
	useEffect(() => {
		const abortController = new AbortController()
		setFollowerCount(0)
		setFollowCount(0)
		setErrors([])
		bsky.getProfiles(
			{
				actors: followersOf === followedBy ? [followedBy] : [followersOf, followedBy]
			},
			{ signal: abortController.signal }
		)
			.then(({ data }) => {
				const followerCount = data.profiles.find(p => p.handle === followersOf)?.followersCount ?? 0
				const followCount = data.profiles.find(p => p.handle === followedBy)?.followsCount ?? 0
				setFollowerCount(followerCount)
				setFollowCount(followCount)
			})
			.catch(processError)

		return () => {
			abortController.abort()
		}
	}, [followersOf, followedBy])

	// fetch the first user's follower list
	useEffect(() => {
		let stop = false
		const abortController = new AbortController()
		if (followersOf) {
			setCompletedFetchingFollowers(false)
			setFollowers([])
			async function fetchFollowers(cursor?: string) {
				try {
					const { data } = await bsky.getFollowers(
						{
							actor: followersOf,
							limit: 100,
							cursor
						},
						{ signal: abortController.signal }
					)
					if (!stop) {
						setFollowers(prev => [...prev, ...data.followers.map(simplifyUser)])
						if (data.cursor) {
							fetchFollowers(data.cursor)
						} else {
							setCompletedFetchingFollowers(true)
						}
					}
				} catch (e) {
					if (!stop) processError(e)
				}
			}
			fetchFollowers()
		} else {
			setCompletedFetchingFollowers(true)
		}

		return () => {
			stop = true
			abortController.abort()
			setFollowers([])
		}
	}, [followersOf])

	// fetch the second user's follows list
	useEffect(() => {
		let stop = false
		const abortController = new AbortController()
		if (followedBy) {
			setCompletedFetchingFollows(false)
			setFollows([])
			async function fetchFollows(cursor?: string) {
				try {
					const { data } = await bsky.getFollows(
						{
							actor: followedBy,
							limit: 100,
							cursor
						},
						{ signal: abortController.signal }
					)
					if (!stop) {
						setFollows(prev => [...prev, ...data.follows.map(simplifyUser)])
						if (data.cursor) {
							fetchFollows(data.cursor)
						} else {
							setCompletedFetchingFollows(true)
						}
					}
				} catch (e) {
					if (!stop) processError(e)
				}
			}
			fetchFollows()
		} else {
			setCompletedFetchingFollows(true)
		}

		return () => {
			stop = true
			abortController.abort()
			setFollows([])
		}
	}, [followedBy])

	// filter to the users that should be shown in the list
	const usersToShow = useMemo(
		() =>
			followersOf && followedBy
				? followers.filter(follower => follows.some(u => u.did === follower.did))
				: followersOf
				? followers
				: follows,
		[followers, followersOf, followedBy, follows]
	)

	// fetch the follower count of each user in the list
	useEffect(() => {
		let stop = false
		const abortController = new AbortController()
		if (completedFetchingFollowers && completedFetchingFollows) {
			async function getFollowerCounts() {
				let usersToFetch = usersToShow.map(user => user.did)

				while (usersToFetch.length && !stop) {
					const userSlice = usersToFetch.slice(0, 25)
					usersToFetch = usersToFetch.slice(25)
					bsky.getProfiles(
						{
							actors: userSlice
						},
						{ signal: abortController.signal }
					)
						.then(({ data }) => {
							setFollowerCounts(prev => ({
								...prev,
								...data.profiles.reduce(
									(acc, profile) => ({
										...acc,
										[profile.did]: profile.followersCount
									}),
									{}
								)
							}))
						})
						.catch(e => {
							if (!stop) processError(e)
						})
				}
			}
			getFollowerCounts()

			return () => {
				stop = true
				abortController.abort()
			}
		}
	}, [completedFetchingFollowers, completedFetchingFollows, usersToShow])

	// these are for the progress bar
	const numFollowersFetched = completedFetchingFollowers ? followerCount : followers.length
	const numFollowsFetched = completedFetchingFollows ? followCount : follows.length
	const intersectionUpperBound = Math.max(followerCount, followCount)
	// if we need to get an intersection of unknown size, we guess it's at most 10% of the larger number.
	// when we get the actual size, the progress bar jumps. ideally it will not jump backwards.
	const numFollowerCountsToFetch =
		completedFetchingFollowers && completedFetchingFollows
			? usersToShow.length
			: followersOf && followedBy
			? intersectionUpperBound / 10
			: intersectionUpperBound
	const numFollowerCountsFetched = Object.keys(followerCounts).filter(did =>
		usersToShow.some(user => user.did === did)
	).length

	const completedFetching =
		completedFetchingFollowers && completedFetchingFollows && numFollowerCountsFetched === numFollowerCountsToFetch

	return (
		<>
			{errors.length > 0 ? (
				<p className={styles.homeText}>🚫 {[...new Set(errors)].join(', ')}</p>
			) : completedFetching ? (
				usersToShow.length === 0 ? (
					<p className={styles.homeText}>No results found!</p>
				) : (
					<p className={styles.numResults}>{fullFormatter.format(usersToShow.length)} results found!</p>
				)
			) : (
				<>
					{followerCount + followCount > 25_000 && (
						<p>
							⚠️ This query will need to fetch{' '}
							<span title={fullFormatter.format(followerCount + followCount)}>
								{compactFormatter.format(followerCount + followCount)}
							</span>{' '}
							users, so it will take a while!
						</p>
					)}
					<progress
						value={numFollowersFetched + numFollowsFetched + numFollowerCountsFetched / 2}
						max={followerCount + followCount + numFollowerCountsToFetch / 2}
						className={styles.progress}
					/>
				</>
			)}
			<div>
				{usersToShow
					.sort((a, b) => followerCounts[b.did] - followerCounts[a.did])
					.map(user => (
						<UserDisplay key={user.did} user={user} followerCount={followerCounts[user.did]} />
					))}
			</div>
		</>
	)
}
