[**legenchess**](../README.md)

***

[legenchess](../README.md) / PieceDef

# Interface: PieceDef

## Properties

### atk

> **atk**: `number`

***

### attack

> **attack**: [`AttackKind`](../type-aliases/AttackKind.md)

***

### description?

> `optional` **description?**: `string`

***

### hp

> **hp**: `number`

***

### move

> **move**: [`MoveKind`](../type-aliases/MoveKind.md)

***

### name

> **name**: `string`

***

### passive?

> `optional` **passive?**: `object`

#### onKill?

> `optional` **onKill?**: (`state`, `pieceId`, `targetId`) => [`GameState`](GameState.md)

##### Parameters

###### state

[`GameState`](GameState.md)

###### pieceId

`string`

###### targetId

`string`

##### Returns

[`GameState`](GameState.md)

#### onTurnStart?

> `optional` **onTurnStart?**: (`state`, `pieceId`) => [`GameState`](GameState.md)

##### Parameters

###### state

[`GameState`](GameState.md)

###### pieceId

`string`

##### Returns

[`GameState`](GameState.md)

***

### short

> **short**: `string`

***

### skill

> **skill**: `string`

***

### type

> **type**: `string`
