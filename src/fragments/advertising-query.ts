import { gql } from '@apollo/client'

/**
 * GraphQL query for advertising settings.
 * Matches the WPGraphQL schema registered by the ncmaz-faust-core plugin.
 *
 * This query is fetched client-side by AdvertisingProvider and consumed
 * by the AdSpace component via AdvertisingContext.
 */
export const QUERY_GET_ADVERTISING_SETTINGS = gql`
	query GetAdvertisingSettings {
		ncmazFaustAdvertising {
			enabled
			slots {
				key
				label
				enabled
				priority
				provider
				openInNewTab
				nofollowSponsored
				startDate
				endDate
				desktop {
					enabled
					provider
					adsenseClient
					adsenseSlot
					image {
						sourceUrl
						altText
					}
					linkUrl
					customHtml
					width
					height
				}
				mobile {
					enabled
					provider
					adsenseClient
					adsenseSlot
					image {
						sourceUrl
						altText
					}
					linkUrl
					customHtml
					width
					height
				}
			}
		}
	}
`
