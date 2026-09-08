import { NC_SITE_SETTINGS } from '@/contains/site-settings'

export const AD_SPACE_ZONES = [
	'header',
	'index_top',
	'index_bottom',
	'sidebar_1',
	'sidebar_2',
	'post_detail_top',
	'post_detail_bottom',
	'in_article',
] as const

export type AdSpaceZone = (typeof AD_SPACE_ZONES)[number] | (string & {})

export type AdProvider = 'adsense' | 'custom_banner' | 'custom_html'

export type AdPlacement = {
	enabled?: boolean
	provider?: AdProvider
	adsenseClient?: string | null
	adsenseSlot?: string | null
	imageUrl?: string | null
	imageAlt?: string | null
	linkUrl?: string | null
	customHtml?: string | null
	width?: string | number | null
	height?: string | number | null
	openInNewTab?: boolean
	nofollowSponsored?: boolean
	className?: string | null
	ariaLabel?: string | null
}

export type AdSlotConfig = {
	key: AdSpaceZone
	label?: string | null
	enabled?: boolean
	priority?: number | null
	provider?: AdProvider
	desktop?: AdPlacement | null
	mobile?: AdPlacement | null
	placement?: AdPlacement | null
}

type AdvertisingSettings = {
	enable?: boolean
	adSpaces?: AdSlotConfig[]
	zones?: Record<string, AdSlotConfig | AdSlotConfig[]>
	slots?: Record<string, AdSlotConfig | AdSlotConfig[]>
}

const settings = (NC_SITE_SETTINGS as any).advertising as
	| AdvertisingSettings
	| undefined

export const isAdvertisingEnabled = () => {
	if (process.env.NEXT_PUBLIC_ENABLE_ADS === 'false') {
		return false
	}

	return settings?.enable ?? true
}

const normalizeSlotValue = (
	zone: AdSpaceZone,
	rawValue: AdSlotConfig | AdSlotConfig[] | undefined,
) => {
	if (!rawValue) {
		return [] as AdSlotConfig[]
	}

	const slots = Array.isArray(rawValue) ? rawValue : [rawValue]

	return slots
		.filter(Boolean)
		.map((item) => ({
			...item,
			key: item.key || zone,
		}))
		.filter((item) => item.enabled ?? true)
}

export const getAdSlots = (zone: AdSpaceZone) => {
	if (!isAdvertisingEnabled()) {
		return [] as AdSlotConfig[]
	}

	const fromZones = settings?.zones?.[zone]
	const fromSlots = settings?.slots?.[zone]
	const fromList = settings?.adSpaces?.filter((item) => item.key === zone)

	return normalizeSlotValue(zone, fromZones ?? fromSlots ?? fromList)
		.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

export const getAdSlot = (zone: AdSpaceZone, index = 0) => {
	const slots = getAdSlots(zone)
	if (!slots.length) {
		return null
	}

	return slots[index % slots.length] || slots[0] || null
}

export const resolvePlacement = (
	slot: AdSlotConfig,
	viewport: 'desktop' | 'mobile',
): AdPlacement | null => {
	const placement =
		viewport === 'desktop'
			? { ...(slot.placement || {}), ...(slot.desktop || {}) }
			: { ...(slot.placement || {}), ...(slot.mobile || {}) }

	const provider = placement.provider || slot.provider
	const enabled = placement.enabled ?? slot.enabled ?? true

	if (!enabled) {
		return null
	}

	return {
		...placement,
		provider,
	}
}
