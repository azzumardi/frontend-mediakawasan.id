import { WordPressBlock } from '@faustwp/blocks'
import React from 'react'

type Props = {
	renderedHtml?: string
}

const NcmazFaustBlockAdSpace: WordPressBlock<Props> = ({ renderedHtml }) => {
	if (!renderedHtml) {
		return null
	}

	return (
		<div
			className="ncmazfaust-block-AdSpace not-prose"
			dangerouslySetInnerHTML={{ __html: renderedHtml }}
		/>
	)
}

NcmazFaustBlockAdSpace.displayName = 'NcmazFaustBlockAdSpace'
NcmazFaustBlockAdSpace.config = {
	name: 'NcmazFaustBlockAdSpace',
}

export default NcmazFaustBlockAdSpace
