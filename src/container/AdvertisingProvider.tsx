'use client'

import React, { createContext, FC, useEffect, useRef } from 'react'
import { useQuery } from '@apollo/client'
import { QUERY_GET_ADVERTISING_SETTINGS } from '@/fragments/advertising-query'
import {
	setAdvertisingData,
	normalizeGQLSlot,
	GQLAdvertisingSettings,
	AdSlotConfig,
} from '@/contains/advertising'

type AdvertisingQueryResponse = {
	ncmazFaustAdvertising: GQLAdvertisingSettings | null
}

type AdvertisingContextValue = {
	enabled: boolean
	slots: AdSlotConfig[]
	loading: boolean
	error: boolean
}

export const AdvertisingContext = createContext<AdvertisingContextValue>({
	enabled: false,
	slots: [],
	loading: true,
	error: false,
})

interface Props {
	children: React.ReactNode
}

/**
 * Provides global advertising data fetched from WPGraphQL.
 *
 * Fetches once on mount, normalizes the response, and stores it in the
 * advertising module's runtime state so that `getAdSlots()` / `getAdSlot()`
 * can access it synchronously without prop drilling.
 *
 * Also exposes raw data via AdvertisingContext for components that need it.
 */
const AdvertisingProvider: FC<Props> = ({ children }) => {
	const hasSetData = useRef(false)

	const { data, loading, error } = useQuery<AdvertisingQueryResponse>(
		QUERY_GET_ADVERTISING_SETTINGS,
		{
			fetchPolicy: 'cache-and-network',
			nextFetchPolicy: 'cache-first',
			// Don't block rendering on this query.
			ssr: false,
		},
	)

	useEffect(() => {
		if (loading || hasSetData.current) {
			return
		}

		const adData = data?.ncmazFaustAdvertising
		if (!adData) {
			hasSetData.current = true
			return
		}

		const enabled = adData.enabled ?? false
		const rawSlots = adData.slots ?? []
		const normalized: AdSlotConfig[] = rawSlots
			.filter(Boolean)
			.map((s) => normalizeGQLSlot(s!))
			.filter(Boolean) as AdSlotConfig[]

		setAdvertisingData(enabled, normalized)
		hasSetData.current = true
	}, [data, loading])

	const adData = data?.ncmazFaustAdvertising

	const contextValue: AdvertisingContextValue = {
		enabled: adData?.enabled ?? false,
		slots: (adData?.slots ?? [])
			.filter(Boolean)
			.map((s) => normalizeGQLSlot(s!))
			.filter(Boolean) as AdSlotConfig[],
		loading,
		error: !!error,
	}

	return (
		<AdvertisingContext.Provider value={contextValue}>
			{children}
		</AdvertisingContext.Provider>
	)
}

export default AdvertisingProvider
