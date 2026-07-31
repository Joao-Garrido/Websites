import type { Topic } from '../../types'
import general from './general'
import work from './work'
import tech from './tech'
import ideas from './ideas'
import personal from './personal'
import culture from './culture'
import opinions from './opinions'

export const EN_TOPICS: Topic[] = [
  ...general,
  ...work,
  ...tech,
  ...ideas,
  ...personal,
  ...culture,
  ...opinions,
]
