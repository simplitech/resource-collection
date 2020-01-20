# Resource-Collection

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/simplitech/resource-collection.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/simplitech/resource-collection.svg)](https://travis-ci.org/simplitech/resource-collection)
[![Coveralls](https://img.shields.io/coveralls/simplitech/resource-collection.svg)](https://coveralls.io/github/simplitech/resource-collection)
[![Dev Dependencies](https://david-dm.org/simplitech/resource-collection/dev-status.svg)](https://david-dm.org/simplitech/resource-collection?type=dev)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg)](https://paypal.me/AJoverMorales)

A data-structure library to work with ResourceCollections (with Id and Tag) and PageCollections (search and order as well) 

# Install
```
npm i @simpli/resource-collection
```

# Usage

## ResourceCollection
ResourceCollection is a Collection of items containing id and tag

### Import
```typescript
import { ResourceCollection, IResource } from 'resource-collection'
```

### Create your resource class 
Your class must implement `IResource` with `$id` and `$tag` props or getters
```typescript
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
```

### Instantiate a ResourceCollection
You must informing the resource type and optionally an array of items 
```typescript

 const subject = new ResourceCollection(MyResource, [
  new MyResource(1, 'first'),
  new MyResource(2, 'second'),
  new MyResource(3, 'third'),
  new MyResource(4, 'fourth')
])
```

### ResourceCollection basic methods  
```typescript
subject.size() // returns 4
subject.isEmpty() // returns false
subject.first().myName // returns 'first'
subject.last().myName // returns 'fourth'

const allWPH = subject.allWithPlaceholder('hint')
allWPH[0].$tag // returns 'hint'

const allWPHnull = subject.allWithPlaceholder()
allWPHnull[0] // returns null

subject.getById(2).myName // returns 'second'

const twoAnd3 = subject.getManyIds([2, 3])
twoAnd3[0].myName // returns 'second'
twoAnd3[1].myName // returns 'third'

const thebad = new MyResource(666, 'from hell')
const thegood = new MyResource(777, 'mighty one')

subject.add(thebad) // adds in the last position
subject.add(thegood, 0) // adds in the first position

subject.remove(thebad) // thebad was removed
subject.removeById(3) // removed item with id 3
subject.remove(new MyResource(123212, 'unexistent entry')) // not found, no item was removed
subject.removeById(123212) // not found, no item was removed

subject.clear() // remove all items
```

### ResourceCollection has 'filter' features
```typescript
subject.addFilter({ abc: 123, ignoreMe: null, you: 'and me' })
subject.params // ignores null fields and returns { abc: 123, you: 'and me' }
subject.clearFilters() // remove all fields from filter
```

### You can easily use lodash with the `lodash` property
```typescript
const withoutFirst = subject.lodash.drop(1)
withoutFirst.value()[0].myName // returns 'second'
```
 ## PageCollection
 PageCollection is useful to work with paginated collections, it extends ResourceCollection 

### Import
```typescript
import { PageCollection, IResource } from 'resource-collection'
``` 
 
 ### Create your PageCollection
 Differently of ResourceCollection, you must create a class for your collection
 ```typescript
class MyPageCollection extends PageCollection<MyResource> {
  constructor() {
    super(MyResource)
  }

  async queryAsPage() {
    // implement how to update itself with API calls
    // use the PageCollection properties sending to the server
    console.log(this.params) // { search, currentPage, perPage, orderBy, asc }
    const resp = await fetch({/* your http call using the params */})
    // then you need to fill the items and total
    // this.total = <the amount of all items, as if it wasn't paginated>
    // this.items = <the items on the current page>
    // the class is prepared to be used with class-transformer library
    return resp
  }

}
```

## PageCollection props and methods
```
const subject = new MyPageCollection()

subject.setPerPage(20)
subject.lastPage
// if total is 90 the lastPage will be 4. It contains 5 pages, the last page with only 10 items

subject.setCurrentPage(4)
subject.isLastPage // returns true

await subject.queryCurrentPage(3)
// will change the page securely and call queryAsPage

await subject.queryPrevPage()
// will change the page securely and call queryAsPage

await subject.queryNextPage()
// will change the page securely and call queryAsPage

subject.noPagination() // to remove pagination properties
subject.currentPage // returns null
subject.perPage // returns null

await subject.querySearch()
// will call queryAsPage IF the search prop null, empty
// or >= PageCollection.defaultMinCharToSearch, which is 2 by default
// to avoid searching with insufficient caracters

await subject.queryOrderBy('column')
//sets the orderBy field, toggle asc and call queryAsPage
subject.orderBy // returns 'column'
subject.asc // returns true
await subject.queryOrderBy('column')
subject.asc // returns false
```
