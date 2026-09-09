import { WordPressBlock } from '@faustwp/blocks'
import React from 'react'
import AdSpace from '@/components/AdSpace/AdSpace'
import { AdSpaceZone } from '@/contains/advertising'

type Props = {
	attributes?: {
		slot?: string
		label?: string
		showLabel?: boolean
		desktopEnabled?: boolean
		mobileEnabled?: boolean
		desktopMinHeight?: string
		mobileMinHeight?: string
	}
}

/**
 * Renders an NcmazFaust AdSpace block.
 *
 * When an editor inserts the ncmaz-faust/ad-space block in Gutenberg,
 * this component is invoked by the Faust.js blocks system.
 * It reads the `slot` attribute and delegates to the AdSpace component
 * which resolves the ad configuration from WPGraphQL.
 *
 * The block does NOT render arbitrary HTML from renderedHtml.
 * It uses the slot reference to fetch config from ncmazFaustAdvertising.
 */
const NcmazFaustBlockAdSpace: WordPressBlock<Props> = ({ attributes }) => {
	const slot = attributes?.slot as AdSpaceZone | undefined

	if (!slot) {
		return null
	}

	return (
		<AdSpace
			zone={slot}
			className="not-prose my-6"
			wrapperClassName="mx-auto max-w-screen-md"
			placementClassName="rounded border border-neutral-200 p-3 dark:border-neutral-700"
		/>
	)
}

NcmazFaustBlockAdSpace.displayName = 'NcmazFaustBlockAdSpace'
NcmazFaustBlockAdSpace.config = {
	name: 'NcmazFaustBlockAdSpace',
}

export default NcmazFaustBlockAdSpace
