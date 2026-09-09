'use client'

import { useContext } from 'react'
import { AdvertisingContext } from '@/container/AdvertisingProvider'

/**
 * Access global advertising data from the AdvertisingProvider context.
 *
 * Returns the raw GraphQL response data plus loading/error state.
 * For rendering ad components, prefer using getAdSlot()/getAdSlots()
 * from '@/contains/advertising' which automatically uses this data
 * when available.
 */
export const useAdvertising = () => {
	return useContext(AdvertisingContext)
}
