[**legenchess**](../README.md)

***

[legenchess](../README.md) / SkillDefinition

# Interface: SkillDefinition

## Properties

### cost

> **cost**: `number`

***

### description

> **description**: `string`

***

### id

> **id**: `string`

***

### maxTargets?

> `optional` **maxTargets?**: `number`

***

### name

> **name**: `string`

***

### targetMode

> **targetMode**: `"none"` \| `"single"` \| `"multi"`

## Methods

### apply()

> **apply**(`state`, `pieceId`, `targetIds`): [`GameState`](GameState.md)

#### Parameters

##### state

[`GameState`](GameState.md)

##### pieceId

`string`

##### targetIds

`string`[]

#### Returns

[`GameState`](GameState.md)

***

### canUse()

> **canUse**(`state`, `pieceId`): `boolean`

#### Parameters

##### state

[`GameState`](GameState.md)

##### pieceId

`string`

#### Returns

`boolean`

***

### getTargetCells()

> **getTargetCells**(`state`, `pieceId`): [`Cell`](../type-aliases/Cell.md)[]

#### Parameters

##### state

[`GameState`](GameState.md)

##### pieceId

`string`

#### Returns

[`Cell`](../type-aliases/Cell.md)[]
