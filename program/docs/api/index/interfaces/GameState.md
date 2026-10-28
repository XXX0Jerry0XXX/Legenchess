[**legenchess**](../../README.md)

***

[legenchess](../../README.md) / [index](../README.md) / GameState

# Interface: GameState

## Properties

### actionMode

> **actionMode**: [`ActionMode`](../type-aliases/ActionMode.md)

***

### aiPlayer

> **aiPlayer**: [`Owner`](../type-aliases/Owner.md) \| `null`

***

### ap

> **ap**: `number`

***

### board

> **board**: (`string` \| `null`)[][]

***

### clockRunning

> **clockRunning**: `boolean`

***

### currentPlayer

> **currentPlayer**: [`Owner`](../type-aliases/Owner.md)

***

### deadThisTurn

> **deadThisTurn**: `string`[]

***

### firstPlayer

> **firstPlayer**: [`Owner`](../type-aliases/Owner.md)

***

### lastTurnDeaths

> **lastTurnDeaths**: `string`[]

***

### mageTargets

> **mageTargets**: `string`[]

***

### mode

> **mode**: [`GameMode`](../type-aliases/GameMode.md)

***

### observationRemaining

> **observationRemaining**: `number`

***

### pendingPromotion

> **pendingPromotion**: `string` \| `null`

***

### pendingRevive

> **pendingRevive**: `string` \| `null`

***

### phase

> **phase**: [`Phase`](../type-aliases/Phase.md)

***

### pieces

> **pieces**: `Record`\<`string`, [`Piece`](Piece.md)\>

***

### previousTurnDeaths

> **previousTurnDeaths**: `string`[]

***

### selectedId

> **selectedId**: `string` \| `null`

***

### selectedSetupType

> **selectedSetupType**: `string` \| `null`

***

### setupOwner

> **setupOwner**: [`Owner`](../type-aliases/Owner.md)

***

### setupTray

> **setupTray**: `Record`\<[`Owner`](../type-aliases/Owner.md), `Record`\<[`PieceType`](../type-aliases/PieceType.md), `number`\>\>

***

### skillTargets

> **skillTargets**: `string`[]

***

### times

> **times**: `Record`\<[`Owner`](../type-aliases/Owner.md), `number`\>

***

### turn

> **turn**: `number`

***

### turnStarted

> **turnStarted**: `boolean`

***

### winner

> **winner**: [`Winner`](../type-aliases/Winner.md)
