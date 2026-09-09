import { NC_SITE_SETTINGS } from '@/contains/site-settings'

// ─── Zone Keys ──────────────────────────────────────────────────────────────

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

// ─── GraphQL Response Types (matches WPGraphQL schema from plugin) ──────────

export type GQLAdPlacement = {
	enabled: boolean | null
	provider: string | null
	linkUrl: string | null
	adsenseClient: string | null
	adsenseSlot: string | null
	image: {
		sourceUrl: string | null
		altText: string | null
	} | null
	customHtml: string | null
	width: string | null
	height: string | null
}

export type GQLAdSlot = {
	key: string | null
	label: string | null
	enabled: boolean | null
	priority: number | null
	provider: string | null
	openInNewTab: boolean | null
	nofollowSponsored: boolean | null
	startDate: string | null
	endDate: string | null
	desktop: GQLAdPlacement | null
	mobile: GQLAdPlacement | null
}

export type GQLAdvertisingSettings = {
	enabled: boolean | null
	slots: (GQLAdSlot | null)[] | null
}

// ─── Internal Ad Config Types ──────────────────────────────────────────────

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
	openInNewTab?: boolean
	nofollowSponsored?: boolean
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

// ─── Static Fallback Settings ──────────────────────────────────────────────

const staticSettings = (NC_SITE_SETTINGS as any).advertising as
	| AdvertisingSettings
	| undefined

// ─── Runtime State (populated by AdvertisingProvider) ───────────────────────

let _graphqlSlots: AdSlotConfig[] = []
let _graphqlEnabled = false
let _graphqlLoaded = false

/**
 * Called by AdvertisingProvider after GraphQL fetch.
 * Stores normalized ad slot data for synchronous access by getAdSlots/getAdSlot.
 */
export const setAdvertisingData = (
	enabled: boolean,
	slots: AdSlotConfig[],
) => {
	_graphqlEnabled = enabled
	_graphqlSlots = slots
	_graphqlLoaded = true
}

export const isAdvertisingDataLoaded = () => _graphqlLoaded

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize a GQLAdSlot into an AdSlotConfig.
 */
export const normalizeGQLSlot = (slot: GQLAdSlot): AdSlotConfig | null => {
	if (!slot.key) {
		return null
	}

	const mapPlacement = (p: GQLAdPlacement | null): AdPlacement | null => {
		if (!p) {
			return null
		}
		return {
			enabled: p.enabled ?? false,
			provider: (p.provider as AdProvider) || undefined,
			adsenseClient: p.adsenseClient || null,
			adsenseSlot: p.adsenseSlot || null,
			imageUrl: p.image?.sourceUrl || null,
			imageAlt: p.image?.altText || null,
			linkUrl: p.linkUrl || null,
			customHtml: p.customHtml || null,
			width: p.width || null,
			height: p.height || null,
		}
	}

	return {
		key: slot.key as AdSpaceZone,
		label: slot.label || null,
		enabled: slot.enabled ?? true,
		priority: slot.priority ?? 10,
		provider: (slot.provider as AdProvider) || undefined,
		openInNewTab: slot.openInNewTab ?? false,
		nofollowSponsored: slot.nofollowSponsored ?? false,
		desktop: mapPlacement(slot.desktop),
		mobile: mapPlacement(slot.mobile),
	}
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

// ─── Public API ─────────────────────────────────────────────────────────────

export const isAdvertisingEnabled = () => {
	if (process.env.NEXT_PUBLIC_ENABLE_ADS === 'false') {
		return false
	}

	// Prefer GraphQL data if loaded.
	if (_graphqlLoaded) {
		return _graphqlEnabled
	}

	// Fallback to static settings.
	return staticSettings?.enable ?? true
}

/**
 * Get all ad slots for a given zone.
 * Prefers GraphQL data (set by AdvertisingProvider), falls back to static config.
 */
export const getAdSlots = (zone: AdSpaceZone) => {
	if (!isAdvertisingEnabled()) {
		return [] as AdSlotConfig[]
	}

	// Prefer GraphQL data if available.
	if (_graphqlLoaded && _graphqlSlots.length > 0) {
		return _graphqlSlots
			.filter((slot) => slot.key === zone)
			.sort((a, b) => (b.priority || 0) - (a.priority || 0))
	}

	// Fallback to static settings.
	const fromZones = staticSettings?.zones?.[zone]
	const fromSlots = staticSettings?.slots?.[zone]
	const fromList = staticSettings?.adSpaces?.filter((item) => item.key === zone)

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
