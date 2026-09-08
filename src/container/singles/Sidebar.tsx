import { TCategoryCardFull } from '@/components/CardCategory1/CardCategory1'
import WidgetAddSubscriberForm from '@/components/WidgetAddSubscriberForm/WidgetAddSubscriberForm'
import WidgetCategories from '@/components/WidgetCategories/WidgetCategories'
import WidgetSocialsFollow from '@/components/WidgetSocialsFollow/WidgetSocialsFollow'
import AdSpace from '@/components/AdSpace/AdSpace'
import React, { FC } from 'react'

export interface SidebarProps {
	className?: string
	categories: TCategoryCardFull[] | null
}

export const Sidebar: FC<SidebarProps> = ({
	className = 'space-y-6 ',
	categories,
}) => {
	return (
		<div className={`nc-SingleSidebar lg:sticky lg:top-24 ${className}`}>
			<WidgetAddSubscriberForm />
			<AdSpace zone="sidebar_1" className="my-6" />

			<WidgetSocialsFollow />
			<AdSpace zone="sidebar_2" className="my-6" />

			<WidgetCategories categories={categories || []} />
		</div>
	)
}
