import { Exclude, Expose, Type } from 'class-transformer'
import { ResourceCollection } from './ResourceCollection'
import { IResource } from './IResource'
import { ClassType } from './ClassType'

@Exclude()
export abstract class PageCollection<R extends IResource> extends ResourceCollection<R> {
  protected constructor(classType: ClassType<R>) {
    super(classType)
    this.addFilter(this)
  }

  static defaultMinCharToSearch = 3
  static defaultCurrentPage = 0
  static defaultPerPage = 20

  @Expose({ name: 'query', toPlainOnly: true })
  search: string | null = null

  @Expose({ name: 'page', toPlainOnly: true })
  currentPage: number | null = PageCollection.defaultCurrentPage

  @Expose({ name: 'limit', toPlainOnly: true })
  perPage: number | null = PageCollection.defaultPerPage

  @Expose({ name: 'orderBy', toPlainOnly: true })
  orderBy: string | null = null

  @Expose({ name: 'ascending', toPlainOnly: true })
  asc: boolean | null = null

  @Type(options => (options!.newObject as PageCollection<R>).classType)
  @Expose({ name: 'items', toClassOnly: true })
  public items: R[] = []

  @Expose({ name: 'total', toClassOnly: true })
  total: number | null = null

  get isLastPage() {
    const page = this.currentPage || 0
    return page === this.lastPage
  }

  get lastPage() {
    return Math.floor(Math.max((this.total || 0) - 1, 0) / (this.perPage || 1))
  }

  noPagination() {
    return this.setCurrentPage(null).setPerPage(null)
  }

  setSearch(val: string | null) {
    this.search = val
    return this
  }

  setCurrentPage(val: number | null) {
    this.currentPage = val
    return this
  }

  setPerPage(val: number | null) {
    this.perPage = val
    return this
  }

  setOrderBy(val: string | null) {
    this.orderBy = val
    return this
  }

  setAsc(val: boolean | null) {
    this.asc = val
    return this
  }

  abstract async queryAsPage(): Promise<any>

  async querySearch() {
    if (!this.search || !this.search.length || this.search.length >= PageCollection.defaultMinCharToSearch) {
      this.currentPage = 0
      return await this.queryAsPage()
    }
    return Promise.resolve()
  }

  async queryOrderBy(column: string) {
    if (this.orderBy === column) {
      this.asc = !this.asc
    } else {
      this.asc = true
    }
    this.orderBy = column
    return await this.queryAsPage()
  }

  async queryCurrentPage(val: number) {
    if (val > this.lastPage) {
      this.currentPage = this.lastPage
    } else if (val < 0) {
      this.currentPage = 0
    } else this.currentPage = val
    return await this.queryAsPage()
  }

  async queryPrevPage() {
    if (this.currentPage !== null && this.currentPage > 0) {
      this.currentPage--
      return await this.queryAsPage()
    }
    return Promise.resolve()
  }

  async queryNextPage() {
    if (this.currentPage !== null && this.currentPage < this.lastPage) {
      this.currentPage++
      return await this.queryAsPage()
    }
    return Promise.resolve()
  }
}
