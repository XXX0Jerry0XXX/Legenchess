[**legenchess**](../../README.md)

***

[legenchess](../../README.md) / [api](../README.md) / Legenchess

# Variable: Legenchess

> `const` **Legenchess**: `object`

## Type Declaration

### createInitialState

> **createInitialState**: () => [`GameState`](../../index/interfaces/GameState.md)

#### Returns

[`GameState`](../../index/interfaces/GameState.md)

### createPiece

> **createPiece**: (`owner`, `type`) => [`Piece`](../../index/interfaces/Piece.md)

#### Parameters

##### owner

[`Owner`](../../index/type-aliases/Owner.md)

##### type

`string`

#### Returns

[`Piece`](../../index/interfaces/Piece.md)

### dispatch

> **dispatch**: (`state`, `action`) => [`GameState`](../../index/interfaces/GameState.md) = `reducer`

#### Parameters

##### state

[`GameState`](../../index/interfaces/GameState.md)

##### action

[`Action`](../../index/type-aliases/Action.md)

#### Returns

[`GameState`](../../index/interfaces/GameState.md)

### emptyBoard

> **emptyBoard**: () => (`string` \| `null`)[][]

#### Returns

(`string` \| `null`)[][]

### getPiece

> **getPiece**: (`type`) => [`PieceDef`](../../index/interfaces/PieceDef.md) \| `null`

#### Parameters

##### type

`string`

#### Returns

[`PieceDef`](../../index/interfaces/PieceDef.md) \| `null`

### getSkill

> **getSkill**: (`id`) => [`SkillDefinition`](../../index/interfaces/SkillDefinition.md) \| `null`

#### Parameters

##### id

`string`

#### Returns

[`SkillDefinition`](../../index/interfaces/SkillDefinition.md) \| `null`

### helpers

> **helpers**: `object`

#### helpers.opponent

> **opponent**: (`owner`) => [`Owner`](../../index/type-aliases/Owner.md)

##### Parameters

###### owner

[`Owner`](../../index/type-aliases/Owner.md)

##### Returns

[`Owner`](../../index/type-aliases/Owner.md)

#### helpers.playerLabel

> **playerLabel**: (`owner`) => `"A"` \| `"B"`

##### Parameters

###### owner

[`Owner`](../../index/type-aliases/Owner.md)

##### Returns

`"A"` \| `"B"`

### listPieces

> **listPieces**: () => [`PieceDef`](../../index/interfaces/PieceDef.md)[]

#### Returns

[`PieceDef`](../../index/interfaces/PieceDef.md)[]

### listSkills

> **listSkills**: () => [`SkillDefinition`](../../index/interfaces/SkillDefinition.md)[]

#### Returns

[`SkillDefinition`](../../index/interfaces/SkillDefinition.md)[]

### query

> **query**: `object`

#### query.attackCells

> **attackCells**: (`state`, `pieceId`) => [`Cell`](../../index/type-aliases/Cell.md)[] = `getAttackCells`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

###### pieceId

`string`

##### Returns

[`Cell`](../../index/type-aliases/Cell.md)[]

#### query.checkWinner

> **checkWinner**: (`state`) => [`Owner`](../../index/type-aliases/Owner.md) \| `"draw"` \| `null`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

##### Returns

[`Owner`](../../index/type-aliases/Owner.md) \| `"draw"` \| `null`

#### query.computeAp

> **computeAp**: (`state`) => `number`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

##### Returns

`number`

#### query.mageSkillCells

> **mageSkillCells**: (`state`, `pieceId`) => [`Cell`](../../index/type-aliases/Cell.md)[] = `getMageSkillCells`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

###### pieceId

`string`

##### Returns

[`Cell`](../../index/type-aliases/Cell.md)[]

#### query.moveCells

> **moveCells**: (`state`, `pieceId`) => [`Cell`](../../index/type-aliases/Cell.md)[] = `getMoveCells`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

###### pieceId

`string`

##### Returns

[`Cell`](../../index/type-aliases/Cell.md)[]

#### query.warriorSkillCells

> **warriorSkillCells**: (`state`, `pieceId`) => [`Cell`](../../index/type-aliases/Cell.md)[] = `getWarriorSkillCells`

##### Parameters

###### state

[`GameState`](../../index/interfaces/GameState.md)

###### pieceId

`string`

##### Returns

[`Cell`](../../index/type-aliases/Cell.md)[]

### registerPiece

> **registerPiece**: (`def`, `options?`) => [`PieceDef`](../../index/interfaces/PieceDef.md) \| `null`

#### Parameters

##### def

[`PieceDef`](../../index/interfaces/PieceDef.md)

##### options?

###### force?

`boolean`

#### Returns

[`PieceDef`](../../index/interfaces/PieceDef.md) \| `null`

### registerSkill

> **registerSkill**: (`def`, `options?`) => [`SkillDefinition`](../../index/interfaces/SkillDefinition.md) \| `null`

#### Parameters

##### def

[`SkillDefinition`](../../index/interfaces/SkillDefinition.md)

##### options?

###### force?

`boolean`

#### Returns

[`SkillDefinition`](../../index/interfaces/SkillDefinition.md) \| `null`
