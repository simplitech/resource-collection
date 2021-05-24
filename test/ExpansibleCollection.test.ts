import { ExpansibleCollection, IResource } from '../src'

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

class MyExpansibleCollection extends ExpansibleCollection<MyResource> {
  total = 0 // overriding just for tests
  queryAsPageCallCount = 0

  constructor() {
    super(MyResource)
  }

  async queryAsPage() {
    this.queryAsPageCallCount++
    this.addedItems = []

    for (let i = 1; i <= (this.perPage || 0); i++) {
      const mock = new MyResource(i, `mock${i + this.queryAsPageCallCount * 20}`)
      this.addedItems.push(mock)
    }

    return null
  }
}

describe('ExpansibleCollection', () => {
  it('can be instantiable', () => {
    const subject = new MyExpansibleCollection()
    expect(subject).toBeInstanceOf(MyExpansibleCollection)
    expect(subject.isEmpty()).toBe(true)
  })

  it('is expansible', async () => {
    const subject = new MyExpansibleCollection()

    subject.total = 100 // only works on this tests
    subject.setPerPage(20)
    expect(subject.lastPage).toBe(4) // 0, 1, 2, 3, 4 :: 0-19, 20-39, 40-59, 60-79, 80-99

    expect(subject.currentPage).toBe(null)
    expect(subject.maxPerPage).toBe(20)

    await subject.expand() // 0-19
    expect(subject.currentPage).toBe(0)
    expect(subject.items.length).toBe(20)
    expect(subject.maxPerPage).toBe(20)

    await subject.expand() // 20-39
    expect(subject.currentPage).toBe(1)
    expect(subject.items.length).toBe(40)
    expect(subject.maxPerPage).toBe(40)

    await subject.expand() // 40-59
    expect(subject.currentPage).toBe(2)
    expect(subject.items.length).toBe(60)
    expect(subject.maxPerPage).toBe(60)

    await subject.expand() // 60-79
    expect(subject.currentPage).toBe(3)
    expect(subject.items.length).toBe(80)
    expect(subject.maxPerPage).toBe(80)

    await subject.expand() // 80-99
    expect(subject.currentPage).toBe(4)
    expect(subject.items.length).toBe(100)
    expect(subject.maxPerPage).toBe(100)

    expect(subject.isLastPage).toBeTruthy()

    await subject.expand() // no effect
    expect(subject.currentPage).toBe(4)
    expect(subject.items.length).toBe(100)
    expect(subject.maxPerPage).toBe(100)

    expect(subject.isLastPage).toBeTruthy()

    await subject.update()
    expect(subject.currentPage).toBe(4)
    expect(subject.perPage).toBe(20)
    expect(subject.items.length).toBe(100)
    expect(subject.maxPerPage).toBe(100)

    await subject.queryOrderBy('any')
    expect(subject.currentPage).toBe(4)
    expect(subject.perPage).toBe(20)
    expect(subject.items.length).toBe(100)
    expect(subject.maxPerPage).toBe(100)

    await subject.queryToFirstPage()
    expect(subject.currentPage).toBe(0)
    expect(subject.items.length).toBe(20)
    expect(subject.maxPerPage).toBe(20)

    subject.onBeforeSerialization()
    subject.onAfterSerialization()
  })

  it('works with pages', async () => {
    const subject = new MyExpansibleCollection()

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

    subject.setCurrentPage(null)
    await subject.queryPrevPage()
    expect(subject.currentPage).toBeNull()
    expect(subject.queryAsPageCallCount).toBe(4) // not called

    subject.setCurrentPage(10)
    await subject.queryNextPage()
    expect(subject.currentPage).toBe(10)
    expect(subject.queryAsPageCallCount).toBe(4) // not called

    subject.setCurrentPage(null)
    await subject.queryNextPage()
    expect(subject.currentPage).toBeNull()
    expect(subject.queryAsPageCallCount).toBe(4) // not called

    subject.setCurrentPage(2)
    await subject.queryNextPage()
    expect(subject.currentPage).toBe(3)
    expect(subject.queryAsPageCallCount).toBe(5)

    subject.noPagination()
    expect(subject.currentPage).toBeNull()
    expect(subject.perPage).toBeNull()
    expect(subject.queryAsPageCallCount).toBe(5) // not called
  })

  it('works with search', async () => {
    const subject = new MyExpansibleCollection()

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
    const subject = new MyExpansibleCollection()

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
