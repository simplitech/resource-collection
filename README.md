# Resource-Collection

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/simplitech/resource-collection.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/simplitech/resource-collection.svg)](https://travis-ci.org/simplitech/resource-collection)
[![Coveralls](https://img.shields.io/coveralls/simplitech/resource-collection.svg)](https://coveralls.io/github/simplitech/resource-collection)
[![Dev Dependencies](https://david-dm.org/simplitech/resource-collection/dev-status.svg)](https://david-dm.org/simplitech/resource-collection?type=dev)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg)](https://paypal.me/AJoverMorales)

A library to work with ResourceCollections (with Id and Tag) and PageCollections (search and order as well) 

# Install
```
npm i @simpli/resource-collection
```

# Usage

## ResourceCollection
Create your resource class that implements IResource.
You must implement `$id` and `$tag` props or getters
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

You can instantiate a ResourceCollection informing the resource type and optionally a array of items 
```typescript

 const subject = new ResourceCollection(MyResource, [
  new MyResource(1, 'first'),
  new MyResource(2, 'second'),
  new MyResource(3, 'third'),
  new MyResource(4, 'fourth')
])
```

Use the useful ResourceCollection methods  
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

ResourceCollection has 'filter' features
```typescript
subject.addFilter({ abc: 123, ignoreMe: null, you: 'and me' })
subject.params // ignores null fields and returns { abc: 123, you: 'and me' }
subject.clearFilters() // remove all fields from filter
```

You can easily use lodash with the `lodash` property
```typescript
const withoutFirst = subject.lodash.drop(1)
withoutFirst.value()[0].myName // returns 'second'
```
