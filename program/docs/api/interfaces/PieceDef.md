[**legenchess**](../README.md)

***

[legenchess](../README.md) / PieceDef

# Interface: PieceDef

Defined in: [types.ts:16](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L16)

## Properties

### atk

> **atk**: `number`

Defined in: [types.ts:20](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L20)

***

### attack

> **attack**: [`AttackKind`](../type-aliases/AttackKind.md)

Defined in: [types.ts:23](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L23)

***

### description?

> `optional` **description?**: `string`

Defined in: [types.ts:25](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L25)

***

### hp

> **hp**: `number`

Defined in: [types.ts:21](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L21)

***

### move

> **move**: [`MoveKind`](../type-aliases/MoveKind.md)

Defined in: [types.ts:22](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L22)

***

### name

> **name**: `string`

Defined in: [types.ts:18](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L18)

***

### passive?

> `optional` **passive?**: `object`

Defined in: [types.ts:26](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L26)

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

Defined in: [types.ts:19](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L19)

***

### skill

> **skill**: `string`

Defined in: [types.ts:24](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L24)

***

### type

> **type**: `string`

Defined in: [types.ts:17](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L17)
