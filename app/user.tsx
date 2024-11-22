import Image from 'next/image'
import styles from './user.module.css'
import { compactFormatter, fullFormatter } from './numberFormatter'
import { User } from './types'

export default function UserDisplay({ user, followerCount }: { user: User; followerCount?: number }) {
	return (
		<a
			href={`https://bsky.app/profile/${user.handle !== 'handle.invalid' ? user.handle : user.did}`}
			target="_blank"
			className={styles.user}
		>
			<Image
				src={
					user.avatar?.replace('/img/avatar/plain/', '/img/avatar_thumbnail/plain/') ?? '/default-avatar.svg'
				}
				alt={user.displayName ?? user.handle}
				width={40}
				height={40}
				className={styles.avatar}
			/>
			<p className={styles.displayname}>{user.displayName || user.handle}</p>
			<p className={styles.details}>
				<span>{user.handle !== 'handle.invalid' ? '@' + user.handle : 'Invalid Handle'}</span>
				{followerCount && (
					<>
						<span>·</span>
						<span title={fullFormatter.format(followerCount) + ' followers'}>
							{compactFormatter.format(followerCount)}&nbsp;followers
						</span>
					</>
				)}
			</p>
		</a>
	)
}
