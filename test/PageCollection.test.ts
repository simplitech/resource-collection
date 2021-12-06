import { PageCollection, IResource } from '../src'

class MyResource implements IResource {
  get $id() {
    return this.myId
  }
  get $tag() {
    return this.myName
  }

  myId: number
  myName: string

  constructor(myId: number, myName: string) {
    this.myId = myId
    this.myName = myName
  }
}

class MyPageCollection extends PageCollection<MyResource> {
  total = 0 // overriding just for tests
  queryAsPageCallCount = 0

  constructor() {
    super(MyResource)
  }

  async queryAsPage() {
    this.queryAsPageCallCount++
    return null
  }
}

describe('PageCollection', () => {
  it('can be instantiable', () => {
    const subject = new MyPageCollection()
    expect(subject).toBeInstanceOf(MyPageCollection)
    expect(subject.isEmpty()).toBe(true)
  })
  it('works with pages', async () => {
    const subject = new MyPageCollection()

    subject.total = 90 // only works on this tests
    subject.setPerPage(20)
    expect(subject.lastPage).toBe(4) // 0, 1, 2, 3, 4 :: 0-19, 20-39, 40-59, 60-79, 80-89

    subject.setCurrentPage(4)
    expect(subject.isLastPage).toBeTruthy()

    expect(subject.queryAsPageCallCount).toBe(0)

    await subject.queryCurrentPage(-2)
    expect(subject.currentPage).toBe(0)
    expect(subject.queryAsPageCallCount).toBe(1)

    await subject.queryCurrentPage(10)
    expect(subject.currentPage).toBe(4)
    expect(subject.queryAsPageCallCount).toBe(2)

    await subject.queryCurrentPage(3)
    expect(subject.currentPage).toBe(3)
    expect(subject.queryAsPageCallCount).toBe(3)

    await subject.queryPrevPage()
    expect(subject.currentPage).toBe(2)
    expect(subject.queryAsPageCallCount).toBe(4)

    subject.setCurrentPage(0)
    await subject.queryPrevPage()
    expect(subject.currentPage).toBe(0)
    expect(subject.queryAsPageCallCount).toBe(4) // not called

    subject.setCurrentPage(10)
    await subject.queryNextPage()
    expect(subject.currentPage).toBe(10)
    expect(subject.queryAsPageCallCount).toBe(4) // not called

    subject.setCurrentPage(2)
    await subject.queryNextPage()
    expect(subject.currentPage).toBe(3)
    expect(subject.queryAsPageCallCount).toBe(5)

    subject.noPagination()
    expect(subject.currentPage).toBe(0)
    expect(subject.perPage).toBeNull()
    expect(subject.queryAsPageCallCount).toBe(5) // not called
  })
  it('works with search', async () => {
    const subject = new MyPageCollection()

    expect(subject.queryAsPageCallCount).toBe(0)

    await subject.querySearch()
    expect(subject.queryAsPageCallCount).toBe(1)

    subject.setSearch('li')
    await subject.querySearch()
    expect(subject.queryAsPageCallCount).toBe(1) // not called because 0 < li < 3

    subject.setSearch('my query')
    await subject.querySearch()
    expect(subject.queryAsPageCallCount).toBe(2)
  })
  it('works with orderBy and Asc', async () => {
    const subject = new MyPageCollection()

    expect(subject.orderBy).toBeNull()
    expect(subject.asc).toBeNull()
    expect(subject.queryAsPageCallCount).toBe(0)

    await subject.queryOrderBy('column')
    expect(subject.orderBy).toBe('column')
    expect(subject.asc).toBe(true)
    expect(subject.queryAsPageCallCount).toBe(1)

    await subject.queryOrderBy('column')
    expect(subject.orderBy).toBe('column')
    expect(subject.asc).toBe(false)
    expect(subject.queryAsPageCallCount).toBe(2)

    subject.setOrderBy('othercol')
    expect(subject.orderBy).toBe('othercol')

    subject.setAsc(true)
    expect(subject.asc).toBe(true)

    expect(subject.queryAsPageCallCount).toBe(2) // not called
  })
})
