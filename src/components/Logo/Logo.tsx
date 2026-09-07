import React from 'react'
import Link from 'next/link'
import MyImage from '../MyImage'
import { NC_SITE_SETTINGS } from '@/contains/site-settings'

export interface LogoProps {
	className?: string
	imageClassName?: string
}

const Logo: React.FC<LogoProps> = ({ className = '', imageClassName }) => {
	let logoSrc = NC_SITE_SETTINGS.site_info?.site_logo || ''
	let logoLightSrc =
		NC_SITE_SETTINGS.site_info?.site_logo_light || logoSrc || ''

	if (!logoLightSrc && !logoSrc) {
		return null
	}

	return (
		<Link
			href="/"
			className={`ttnc-logo inline-block flex-shrink-0 text-primary-600 ${className}`}
		>
			<MyImage
				className={'block w-36 sm:w-44 dark:hidden ' + imageClassName}
				src={logoSrc || ''}
				alt={'Logo'}
				width={256}
				height={76}
			/>
			<MyImage
				className={'hidden w-36 sm:w-44 dark:block ' + imageClassName}
				src={logoLightSrc || ''}
				alt={'Logo'}
				width={256}
				height={76}
			/>
		</Link>
	)
}

export default Logo
