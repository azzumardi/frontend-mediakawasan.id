'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import type { AdPlacement } from '@/contains/advertising'

interface Props {
	unit: AdPlacement
	className?: string
}

const AdSenseUnit = ({ unit, className = '' }: Props) => {
	const pushedRef = useRef(false)

	useEffect(() => {
		if (pushedRef.current) {
			return
		}

		if (typeof window === 'undefined') {
			return
		}

		if (!unit.adsenseClient || !unit.adsenseSlot) {
			return
		}

		try {
			(window as any).adsbygoogle = (window as any).adsbygoogle || []
			;(window as any).adsbygoogle.push({})
			pushedRef.current = true
		} catch (error) {
			console.error('Failed to initialize AdSense unit.', error)
		}
	}, [unit.adsenseClient, unit.adsenseSlot])

	if (!unit.adsenseClient || !unit.adsenseSlot) {
		return null
	}

	return (
		<div className={className}>
			<Script
				id={`ncmaz-adsense-script-${unit.adsenseClient}`}
				src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${unit.adsenseClient}`}
				crossOrigin="anonymous"
				strategy="afterInteractive"
			/>
			<ins
				className="adsbygoogle block"
				style={{ display: 'block' }}
				data-ad-client={unit.adsenseClient}
				data-ad-slot={unit.adsenseSlot}
				data-ad-format="auto"
				data-full-width-responsive="true"
			/>
		</div>
	)
}

export default AdSenseUnit
