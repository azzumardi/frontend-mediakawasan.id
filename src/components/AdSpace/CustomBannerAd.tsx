import { AdPlacement } from '@/contains/advertising'

interface Props {
	unit: AdPlacement
	className?: string
}

const CustomBannerAd = ({ unit, className = '' }: Props) => {
	if (!unit.imageUrl) {
		return null
	}

	const linkProps = unit.linkUrl
		? {
			href: unit.linkUrl,
			target: unit.openInNewTab ? '_blank' : '_self',
			rel: unit.nofollowSponsored
				? 'sponsored nofollow noopener noreferrer'
				: 'noopener noreferrer',
		}
		: null

	const image = (
		<img
			src={unit.imageUrl}
			alt={unit.imageAlt || 'Advertisement'}
			className="h-auto w-full rounded-2xl object-contain"
			loading="lazy"
		/>
	)

	return (
		<div className={className} aria-label={unit.ariaLabel || 'Advertisement'}>
			{linkProps ? <a {...linkProps}>{image}</a> : image}
		</div>
	)
}

export default CustomBannerAd
