import { classToClass, Exclude, Expose, Type } from 'class-transformer'
import { IResource } from './IResource'
import { PageCollection } from './PageCollection'

@Exclude()
export abstract class ExpansibleCollection<R extends IResource> extends PageCollection<R> {
  currentPage: number | null = null
  queryAsExpansible = this.queryAsPage

  items: R[] = [] // final list
  protected expandedItems: R[] = [] // anti-clone list

  @Type(options => (options!.newObject as ExpansibleCollection<R>).classType)
  @Expose({ name: 'items', toClassOnly: true })
  protected addedItems: R[] = [] // cache list (replaces items from PageCollection)

  protected isExpanding = false

  get isLastPage() {
    return this.currentPage === this.lastPage
  }

  get maxPerPage() {
    const perPage = Number(this.perPage) || 0
    return Math.max(this.size(), perPage)
  }

  async expand() {
    if (this.isLastPage && this.currentPage !== null) {
      return
    }

    if (this.currentPage === null) {
      this.currentPage = 0
    } else {
      this.currentPage += 1
    }

    this.isExpanding = true

    // 1 - call onBeforeSerialization => addedItems = []
    // 2 - populate addedItems => addedItems = response.data
    // 3 - call onAfterSerialization => items = addedItems
    await this.queryAsExpansible()

    // 4 - expand expandedItems
    this.expandedItems.push(...this.addedItems)

    // 5 - populate items with cloned list
    this.items = classToClass(this.expandedItems)

    this.isExpanding = false
  }

  async update() {
    const currentPage = Number(this.currentPage) || 0
    const perPage = Number(this.perPage) || 0

    this.currentPage = 0
    this.perPage = this.maxPerPage

    await this.queryAsExpansible()
    this.expandedItems = [...this.addedItems]
    this.items = classToClass(this.expandedItems)

    this.perPage = perPage
    this.currentPage = currentPage
  }

  async queryToFirstPage() {
    this.currentPage = null
    this.items = []
    this.expandedItems = []
    this.addedItems = []

    return this.expand()
  }

  async queryOrderBy(column: string) {
    const currentPage = Number(this.currentPage) || 0
    const perPage = Number(this.perPage) || 0

    this.currentPage = 0
    this.perPage = this.maxPerPage

    if (this.orderBy === column) {
      this.asc = !this.asc
    } else {
      this.asc = true
    }
    this.orderBy = column

    const resp = await this.queryAsExpansible()

    this.currentPage = currentPage
    this.perPage = perPage

    return resp
  }

  onBeforeSerialization() {
    this.addedItems = []
    this.items = []
  }

  onAfterSerialization() {
    if (!this.isExpanding) {
      this.items = this.addedItems // Works only for pagination
    }
  }
}
