# Resource-Collection

A data-structure library to work with ResourceCollections (with Id and Tag) and PageCollections (search and order as well) 

# Install
```
npm i @simpli/resource-collection class-transformer
```

# Usage

## ResourceCollection
ResourceCollection is a Collection of items containing id and tag

### Import
```typescript
import { ResourceCollection, IResource } from '@simpli/resource-collection'
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
subject.first().$tag // returns 'first'
subject.last().$tag // returns 'fourth'

const allWPH = subject.allWithPlaceholder('hint')
allWPH[0].$tag // returns 'hint'

const allWPHnull = subject.allWithPlaceholder()
allWPHnull[0] // returns null

subject.getById(2).$tag // returns 'second'

const twoAnd3 = subject.getManyIds([2, 3])
twoAnd3[0].$tag // returns 'second'
twoAnd3[1].$tag // returns 'third'

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

 ## PageCollection
PageCollection is useful to work with paginated collections, it extends ResourceCollection 

### Import
```typescript
import { PageCollection, IResource } from '@simpli/resource-collection'
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
    // send the PageCollection properties to the server
    // { search, currentPage, perPage, orderBy, asc }
    // and set other PageCollection properties on response
    // this.total = <the amount of all items, as if it wasn't paginated>
    // this.items = <the items on the current page>
    // the class is prepared to be used with class-transformer library
    
    // example using @simpli/serialized-request:
    return await Request.get(`/mything`, {params: this.params})
          .as(this)
          .getResponse()
  }

}
```

## PageCollection props and methods
```typescript
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

 ### Create your ExpansibleCollection
 This collection can concat new items.
 Note this class expands PageCollection, so this can be used as a regular pagination too.
 ```typescript
class MyExpansibleCollection extends ExpansibleCollection<MyResource> {
  constructor() {
    super(MyResource)
  }

  customFilter: string | null = null  

  async queryAsPage() {
    // implement how to update itself with API calls
    // send the PageCollection properties to the server
    // { search, currentPage, perPage, orderBy, asc }
    // and set other PageCollection properties on response
    // this.total = <the amount of all items, as if it wasn't paginated>
    // this.items = <the items on the current page>
    // the class is prepared to be used with class-transformer library
    
    // example using @simpli/serialized-request:
    return await Request.get(`/mything`, {params: this.params})
          .as(this)
          .getResponse()
  }

}
```

## ResourceCollection props and methods
```typescript
const subject = new MyExpansibleCollection()

subject.setPerPage(20)

await subject.expand() // showing 20 items
await subject.expand() // showing more 20 items; total = 40
await subject.expand() // showing more 20 items; total = 60

subject.customFilter = 'foo'

await subject.update() // updates the information after the filter; still 60 items
// or
await subject.queryToFirstPage() // reset collection to its initial state; showing 20 items

await subject.queryOrderBy('bar') // apply orderby filter
```
