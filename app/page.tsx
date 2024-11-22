import styles from './page.module.css'
import FollowList, { HomeText } from './followList'
import BlueskyLogo from './blueskyLogo'
import Form, { BaseForm } from './form'
import { Suspense } from 'react'

export default function Home() {
	return (
		<div className={styles.page}>
			<h1 className={styles.header}>
				<BlueskyLogo />
				Bluesky Follower Explorer
			</h1>
			<noscript className={styles.noscript}>⚠️ JavaScript is required to use this site!</noscript>
			<main className={styles.main}>
				<Suspense fallback={<BaseForm />}>
					<Form />
				</Suspense>

				<Suspense fallback={<HomeText />}>
					<FollowList />
				</Suspense>
			</main>
			<footer className={styles.footer}>
				<span>
					Created by{' '}
					<a href="https://bsky.app/profile/advaith.bsky.social" target="_blank">
						advaith.bsky.social
					</a>
				</span>
				<span className={styles.separator}>·</span>
				<span>
					<a href="https://github.com/advaith1/bluesky-followers" target="_blank">
						View Source on GitHub
					</a>
				</span>
			</footer>
		</div>
	)
}
