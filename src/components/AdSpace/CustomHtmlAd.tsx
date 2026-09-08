'use client'

import { useEffect, useRef } from 'react'
import { AdPlacement } from '@/contains/advertising'

interface Props {
	unit: AdPlacement
	className?: string
}

const CustomHtmlAd = ({ unit, className = '' }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const executedRef = useRef(false)

	useEffect(() => {
		if (!containerRef.current || executedRef.current) {
			return
		}

		const container = containerRef.current
		container.innerHTML = unit.customHtml || ''

		const scripts = Array.from(container.getElementsByTagName('script'))
		scripts.forEach((script) => {
			const nextScript = document.createElement('script')
			Array.from(script.attributes).forEach((attribute) => {
				nextScript.setAttribute(attribute.name, attribute.value)
			})
			nextScript.text = script.text
			script.parentNode?.replaceChild(nextScript, script)
		})

		executedRef.current = true
	}, [unit.customHtml])

	if (!unit.customHtml) {
		return null
	}

	return <div ref={containerRef} className={className} />
}

export default CustomHtmlAd
