[**legenchess**](../README.md)

***

[legenchess](../README.md) / GameState

# Interface: GameState

Defined in: [types.ts:74](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L74)

## Properties

### actionMode

> **actionMode**: [`ActionMode`](../type-aliases/ActionMode.md)

Defined in: [types.ts:88](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L88)

***

### aiPlayer

> **aiPlayer**: [`Owner`](../type-aliases/Owner.md) \| `null`

Defined in: [types.ts:77](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L77)

***

### ap

> **ap**: `number`

Defined in: [types.ts:82](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L82)

***

### board

> **board**: (`string` \| `null`)[][]

Defined in: [types.ts:83](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L83)

***

### clockRunning

> **clockRunning**: `boolean`

Defined in: [types.ts:99](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L99)

***

### currentPlayer

> **currentPlayer**: [`Owner`](../type-aliases/Owner.md)

Defined in: [types.ts:79](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L79)

***

### deadThisTurn

> **deadThisTurn**: `string`[]

Defined in: [types.ts:93](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L93)

***

### firstPlayer

> **firstPlayer**: [`Owner`](../type-aliases/Owner.md)

Defined in: [types.ts:78](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L78)

***

### lastTurnDeaths

> **lastTurnDeaths**: `string`[]

Defined in: [types.ts:91](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L91)

***

### mageTargets

> **mageTargets**: `string`[]

Defined in: [types.ts:89](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L89)

***

### mode

> **mode**: [`GameMode`](../type-aliases/GameMode.md)

Defined in: [types.ts:76](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L76)

***

### observationRemaining

> **observationRemaining**: `number`

Defined in: [types.ts:98](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L98)

***

### pendingPromotion

> **pendingPromotion**: `string` \| `null`

Defined in: [types.ts:94](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L94)

***

### pendingRevive

> **pendingRevive**: `string` \| `null`

Defined in: [types.ts:95](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L95)

***

### phase

> **phase**: [`Phase`](../type-aliases/Phase.md)

Defined in: [types.ts:75](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L75)

***

### pieces

> **pieces**: `Record`\<`string`, [`Piece`](Piece.md)\>

Defined in: [types.ts:84](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L84)

***

### previousTurnDeaths

> **previousTurnDeaths**: `string`[]

Defined in: [types.ts:92](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L92)

***

### selectedId

> **selectedId**: `string` \| `null`

Defined in: [types.ts:86](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L86)

***

### selectedSetupType

> **selectedSetupType**: `string` \| `null`

Defined in: [types.ts:87](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L87)

***

### setupOwner

> **setupOwner**: [`Owner`](../type-aliases/Owner.md)

Defined in: [types.ts:80](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L80)

***

### setupTray

> **setupTray**: `Record`\<[`Owner`](../type-aliases/Owner.md), `Record`\<[`PieceType`](../type-aliases/PieceType.md), `number`\>\>

Defined in: [types.ts:85](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L85)

***

### skillTargets

> **skillTargets**: `string`[]

Defined in: [types.ts:90](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L90)

***

### times

> **times**: `Record`\<[`Owner`](../type-aliases/Owner.md), `number`\>

Defined in: [types.ts:97](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L97)

***

### turn

> **turn**: `number`

Defined in: [types.ts:81](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L81)

***

### turnStarted

> **turnStarted**: `boolean`

Defined in: [types.ts:100](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L100)

***

### winner

> **winner**: [`Winner`](../type-aliases/Winner.md)

Defined in: [types.ts:96](https://github.com/XXX0Jerry0XXX/Legenchess/blob/12c874846e71d352dc161ff4e663f0d2739bbf6b/program/src/game/types.ts#L96)
