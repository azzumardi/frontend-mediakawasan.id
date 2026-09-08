'use client'

import { FC, useMemo } from 'react'
import {
	AdPlacement,
	AdProvider,
	AdSpaceZone,
	getAdSlot,
	resolvePlacement,
} from '@/contains/advertising'
import AdSenseUnit from './AdSenseUnit'
import CustomBannerAd from './CustomBannerAd'
import CustomHtmlAd from './CustomHtmlAd'

interface Props {
	zone: AdSpaceZone
	index?: number
	className?: string
	wrapperClassName?: string
	placementClassName?: string
}

const renderPlacement = (unit: AdPlacement, className?: string) => {
	switch (unit.provider as AdProvider) {
		case 'adsense':
			return <AdSenseUnit unit={unit} className={className} />
		case 'custom_html':
			return <CustomHtmlAd unit={unit} className={className} />
		case 'custom_banner':
		default:
			return <CustomBannerAd unit={unit} className={className} />
	}
}

const AdSpace: FC<Props> = ({
	zone,
	index = 0,
	className = '',
	wrapperClassName = '',
	placementClassName = '',
}) => {
	const slot = getAdSlot(zone, index)

	const desktopPlacement = useMemo(
		() => (slot ? resolvePlacement(slot, 'desktop') : null),
		[slot],
	)
	const mobilePlacement = useMemo(
		() => (slot ? resolvePlacement(slot, 'mobile') : null),
		[slot],
	)

	if (!desktopPlacement && !mobilePlacement) {
		return null
	}

	return (
		<div className={`nc-AdSpace not-prose ${className}`.trim()} data-ad-zone={zone}>
			<div className={wrapperClassName}>
				{desktopPlacement ? (
					<div className={`hidden md:block ${placementClassName}`.trim()}>
						{renderPlacement(desktopPlacement, placementClassName)}
					</div>
				) : null}
				{mobilePlacement ? (
					<div className={`md:hidden ${placementClassName}`.trim()}>
						{renderPlacement(mobilePlacement, placementClassName)}
					</div>
				) : null}
			</div>
		</div>
	)
}

export default AdSpace
