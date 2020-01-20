import { omitBy, chain } from 'lodash'
import { classToClass, classToPlain, ClassTransformOptions } from 'class-transformer'
import { IResource } from './IResource'
import { ClassType } from './ClassType'
import { Dictionary } from './Dictionary'
import { QueryFilter } from './QueryFilter'

export class ResourceCollection<R extends IResource> {
  constructor(classType: ClassType<R>, items: R[] = []) {
    this.items = items
    this.classType = classType
    this.instance = new classType()
  }

  public items: R[]

  protected filters: QueryFilter[] = []

  readonly classType: ClassType<R>

  readonly instance: R

  get lodash() {
    return chain(this.items)
  }

  get params(): Dictionary<any> {
    const result: QueryFilter = {}

    for (const filter of this.filters) {
      const params = omitBy(classToPlain(filter), item => item === null) as QueryFilter
      Object.assign(result, params)
    }

    return result
  }

  first() {
    return this.items[0]
  }

  last() {
    return this.items[this.items.length - 1]
  }

  size() {
    return this.items.length
  }

  isEmpty() {
    return !this.items.length
  }

  clear() {
    this.items = []
  }

  getById(id: number | null): R | null {
    return this.clone(this.items).find((item: R | IResource) => item.$id === id) || null
  }

  getManyIds(ids: number[]): R[] {
    return this.clone(this.items).filter((item: R | IResource) => ids.find((id: number) => item.$id === id))
  }

  add(item: R, index?: number) {
    if (index !== undefined) {
      this.items.splice(index, 0, item)
    } else {
      this.items.push(item)
    }
  }

  remove(item: R) {
    const index = this.items.indexOf(item)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  removeById(id: number) {
    const index = this.clone(this.items).findIndex((item: R | IResource) => item.$id === id)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  allWithPlaceholder(placeholder: string | null = null): Array<R | null> {
    let item: IResource | null = null

    if (typeof placeholder === 'string') item = { $id: 0, $tag: placeholder }

    const items: Array<R | IResource | null> = this.clone(this.items)
    items.splice(0, 0, item)

    return items as Array<R | null>
  }

  addFilter(filter: QueryFilter) {
    this.filters.push(filter)
    return this
  }

  clearFilters() {
    this.filters = []
    return this
  }

  private clone<T>(fromEntity: T, options?: ClassTransformOptions): T {
    return classToClass(fromEntity, options)
  }

  onBeforeSerialization() {
    this.clear()
  }
}
