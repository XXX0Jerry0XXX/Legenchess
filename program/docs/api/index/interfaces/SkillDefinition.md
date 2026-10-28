[**legenchess**](../../README.md)

***

[legenchess](../../README.md) / [index](../README.md) / SkillDefinition

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

### getActions()

> **getActions**(`state`, `pieceId`, `targetIds`): [`GameAction`](../type-aliases/GameAction.md)[]

#### Parameters

##### state

[`GameState`](GameState.md)

##### pieceId

`string`

##### targetIds

`string`[]

#### Returns

[`GameAction`](../type-aliases/GameAction.md)[]

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
