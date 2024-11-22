'use client'

import { useRouter } from 'next/navigation'
import useParams from './useParams'
import styles from './form.module.css'

const inputProps = {
	placeholder: 'anyone',
	pattern: '^[a-zA-Z0-9.\\-]+\\.[a-zA-Z][a-zA-Z0-9\\-]{1,63}$',
	title: 'Must be a valid Bluesky handle, e.g. "advaith.bsky.social" or "atproto.com"',
	maxLength: 253,
	className: styles.input,
	size: 16
}

export default function Form() {
	const { followersOf, followedBy } = useParams()

	return <BaseForm followersOf={followersOf} followedBy={followedBy} hydrated />
}

export function BaseForm({
	followersOf = '',
	followedBy = '',
	hydrated
}: {
	followersOf?: string
	followedBy?: string
	hydrated?: boolean
}) {
	const { push } = useRouter()

	function submit(data: FormData) {
		const params = new URLSearchParams()
		for (const [key, value] of data.entries() as FormDataIterator<[string, string]>) {
			if (value) params.set(key, value)
		}
		push('?' + params.toString())
	}

	return (
		<form action={submit}>
			<h2 className={styles.titleForm}>
				<span className={styles.formText}>
					<input
						name="followersOf"
						defaultValue={followersOf}
						autoFocus={!followersOf && !followedBy && hydrated}
						{...inputProps}
					/>
					&apos;s followers followed by <input name="followedBy" defaultValue={followedBy} {...inputProps} />
				</span>
				<button className={styles.goButton}>Go</button>
			</h2>
		</form>
	)
}
