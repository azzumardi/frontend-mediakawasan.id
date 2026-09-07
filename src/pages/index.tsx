import { getWordPressProps, WordPressTemplate } from '@faustwp/core'
import { WordPressTemplateProps } from '../types'
import { GetStaticProps } from 'next'
import { REVALIDATE_TIME } from '@/contains/contants'

export default function Page(props: WordPressTemplateProps) {
	return <WordPressTemplate {...props} />
}

export const getStaticProps: GetStaticProps = (ctx) => {
	return getWordPressProps({ ctx, revalidate: REVALIDATE_TIME }).catch((error) => {
		console.error('Failed to fetch WordPress homepage data.', error)
		return { notFound: true as const, revalidate: REVALIDATE_TIME }
	})
}
