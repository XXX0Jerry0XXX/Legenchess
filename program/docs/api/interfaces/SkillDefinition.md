[**legenchess**](../README.md)

***

[legenchess](../README.md) / SkillDefinition

# Interface: SkillDefinition

Defined in: [types.ts:32](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L32)

## Properties

### cost

> **cost**: `number`

Defined in: [types.ts:36](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L36)

***

### description

> **description**: `string`

Defined in: [types.ts:35](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L35)

***

### id

> **id**: `string`

Defined in: [types.ts:33](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L33)

***

### maxTargets?

> `optional` **maxTargets?**: `number`

Defined in: [types.ts:38](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L38)

***

### name

> **name**: `string`

Defined in: [types.ts:34](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L34)

***

### targetMode

> **targetMode**: `"none"` \| `"single"` \| `"multi"`

Defined in: [types.ts:37](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L37)

## Methods

### apply()

> **apply**(`state`, `pieceId`, `targetIds`): [`GameState`](GameState.md)

Defined in: [types.ts:41](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L41)

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

Defined in: [types.ts:40](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L40)

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

Defined in: [types.ts:39](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L39)

#### Parameters

##### state

[`GameState`](GameState.md)

##### pieceId

`string`

#### Returns

[`Cell`](../type-aliases/Cell.md)[]
