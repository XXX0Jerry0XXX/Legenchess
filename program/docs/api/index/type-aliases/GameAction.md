[**legenchess**](../../README.md)

***

[legenchess](../../README.md) / [index](../README.md) / GameAction

# Type Alias: GameAction

> **GameAction** = \{ `amount`: `number`; `attackerId`: `string`; `counterImmune?`: `boolean`; `targetId`: `string`; `type`: `"dealDamage"`; \} \| \{ `amount`: `number`; `pieceId`: `string`; `type`: `"heal"`; \} \| \{ `pieceId`: `string`; `to`: [`Cell`](Cell.md); `type`: `"move"`; \} \| \{ `pieceId`: `string`; `to`: [`Cell`](Cell.md); `type`: `"revive"`; \} \| \{ `type`: `"endTurn"`; \}
