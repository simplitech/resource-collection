import { ResourceCollection, IResource } from '../src'

class MyResource implements IResource {
  get $id (){ return this.myId }
  get $tag () { return this.myName }

  myId: number
  myName: string

  constructor(myId: number, myName: string) {
    this.myId = myId
    this.myName = myName
  }
}

describe("ResourceCollection", () => {
  it("can be instantiable with empty items", () => {
    const subject = new ResourceCollection(MyResource)
    expect(subject).toBeInstanceOf(ResourceCollection)
    expect(subject.isEmpty()).toBe(true)
  })
  it("can be instantiable with items and return them with placeholder", () => {
    const subject = new ResourceCollection(MyResource, [
      new MyResource(1, 'first'),
      new MyResource(2, 'second'),
      new MyResource(3, 'third'),
      new MyResource(4, 'fourth')
    ])
    expect(subject).toBeInstanceOf(ResourceCollection)
    expect(subject.size()).toBe(4)
    expect(subject.isEmpty()).toBe(false)
    expect(subject.first().myName).toBe('first')
    expect(subject.last().myName).toBe('fourth')

    const allWPH = subject.allWithPlaceholder('hint')
    const hint = allWPH[0]
    if (hint == null) throw new Error('should not be null')
    expect(hint.$tag).toBe('hint')
    expect(allWPH.length).toBe(subject.size() + 1)

    const allWPHnull = subject.allWithPlaceholder()
    expect(allWPHnull[0]).toBeNull()
    expect(allWPHnull.length).toBe(subject.size() + 1)
  })
  it("can search by id", () => {
    const subject = new ResourceCollection(MyResource, [
      new MyResource(1, 'first'),
      new MyResource(2, 'second'),
      new MyResource(3, 'third'),
      new MyResource(4, 'fourth')
    ])

    const second = subject.getById(2)
    if (second == null) throw new Error('should not be null')

    expect(second.myName).toBe('second')

    const twoAnd3 = subject.getManyIds([2, 3])
    expect(twoAnd3[0].myName).toBe('second')
    expect(twoAnd3[1].myName).toBe('third')
  })
  it("can add, remove and clear items", () => {
    const subject = new ResourceCollection(MyResource, [
      new MyResource(1, 'first'),
      new MyResource(2, 'second'),
      new MyResource(3, 'third'),
      new MyResource(4, 'fourth')
    ])

    const thebad = new MyResource(666, 'from hell')
    const thegood = new MyResource(777, 'mighty one')

    subject.add(thebad)
    expect(subject.last().myName).toBe('from hell')

    subject.add(thegood, 0)
    expect(subject.first().myName).toBe('mighty one')

    const presize = subject.size()

    subject.remove(new MyResource(123212, 'unexistent entry'))
    expect(subject.size()).toBe(presize) // no item was removed

    subject.removeById(123212)
    expect(subject.size()).toBe(presize) // no item was removed

    subject.remove(thebad)
    expect(subject.size()).toBe(presize - 1)

    subject.removeById(3)
    expect(subject.getById(3)).toBeNull()

    subject.clear()
    expect(subject.isEmpty()).toBeTruthy()
  })
  it("can work with filters", () => {
    const subject = new ResourceCollection(MyResource)
    subject.addFilter({ abc: 123, ignoreMe: null, you: 'and me' })
    expect(subject.params).toEqual({ abc: 123, you: 'and me' })
    subject.clearFilters()
    expect(subject.params).toEqual({})
  })
  it("clears itself when onBeforeSerialization is called", () => {
    const subject = new ResourceCollection(MyResource, [
      new MyResource(1, 'first'),
      new MyResource(2, 'second'),
      new MyResource(3, 'third'),
      new MyResource(4, 'fourth')
    ])

    subject.onBeforeSerialization()
    expect(subject.isEmpty()).toBeTruthy()
  })
})
