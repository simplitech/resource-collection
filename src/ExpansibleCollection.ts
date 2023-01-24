import { instanceToInstance, Exclude, Expose, Type } from 'class-transformer'
import { IResource } from './IResource'
import { PageCollection } from './PageCollection'

@Exclude()
export abstract class ExpansibleCollection<R extends IResource> extends PageCollection<R> {
  _currentPage: number | null = null
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

  // @ts-ignore
  get currentPage() {
    return this._currentPage || 0
  }

  set currentPage(val) {
    this._currentPage = val
  }

  get maxPerPage() {
    const perPage = Number(this.perPage) || 0
    return Math.max(this.size(), perPage)
  }

  async expand() {
    if (this.isLastPage && this._currentPage !== null) {
      return
    }

    if (this._currentPage === null) {
      this._currentPage = 0
    } else {
      this._currentPage += 1
    }

    this.isExpanding = true

    // 1 - call onBeforeSerialization => addedItems = []
    // 2 - populate addedItems => addedItems = response.data
    // 3 - call onAfterSerialization => items = addedItems
    await this.queryAsExpansible()

    // 4 - expand expandedItems
    this.expandedItems.push(...this.addedItems)

    // 5 - populate items with cloned list
    this.items = [...this.expandedItems]

    this.isExpanding = false
  }

  async update() {
    const currentPage = this.currentPage
    const perPage = Number(this.perPage) || 0

    this.currentPage = 0
    this.perPage = this.maxPerPage

    await this.queryAsExpansible()
    this.expandedItems = [...this.addedItems]
    this.items = instanceToInstance(this.expandedItems)

    this.perPage = perPage
    this.currentPage = currentPage
  }

  async queryToFirstPage() {
    this._currentPage = null
    this.items = []
    this.expandedItems = []
    this.addedItems = []

    return this.expand()
  }

  async queryOrderBy(column: string) {
    if (this.orderBy === column) {
      this.asc = !this.asc
    } else {
      this.asc = true
    }

    this.orderBy = column

    return this.update()
  }

  onBeforeSerialization() {
    this.expandedItems = this.items
    this.addedItems = []
    this.items = []
  }

  onAfterSerialization() {
    if (!this.isExpanding) {
      this.items = this.addedItems // Works only for pagination
    }
  }
}
