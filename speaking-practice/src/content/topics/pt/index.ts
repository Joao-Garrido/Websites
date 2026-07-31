import type { Topic } from '../../types'
import general from './geral'
import work from './trabalho'
import tech from './tecnologia'
import ideas from './ideias'
import personal from './pessoal'
import culture from './cultura'
import opinions from './opinioes'

export const PT_TOPICS: Topic[] = [
  ...general,
  ...work,
  ...tech,
  ...ideas,
  ...personal,
  ...culture,
  ...opinions,
]
