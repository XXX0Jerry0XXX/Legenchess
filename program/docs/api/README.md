**legenchess**

***

# legenchess

## Interfaces

- [GameState](interfaces/GameState.md)
- [Piece](interfaces/Piece.md)
- [PieceDef](interfaces/PieceDef.md)
- [SkillDefinition](interfaces/SkillDefinition.md)

## Type Aliases

- [Action](type-aliases/Action.md)
- [ActionMode](type-aliases/ActionMode.md)
- [AttackKind](type-aliases/AttackKind.md)
- [Cell](type-aliases/Cell.md)
- [GameMode](type-aliases/GameMode.md)
- [MoveKind](type-aliases/MoveKind.md)
- [Owner](type-aliases/Owner.md)
- [Phase](type-aliases/Phase.md)
- [PieceType](type-aliases/PieceType.md)
- [SkillId](type-aliases/SkillId.md)
- [SkillKind](type-aliases/SkillKind.md)
- [Winner](type-aliases/Winner.md)

## Variables

- [AI\_STEP\_DELAY\_MS](variables/AI_STEP_DELAY_MS.md)
- [ATTACK\_COST](variables/ATTACK_COST.md)
- [AUTO\_SETUP\_DELAY\_MS](variables/AUTO_SETUP_DELAY_MS.md)
- [BASE\_AP](variables/BASE_AP.md)
- [CHAIRMAN\_BONUS](variables/CHAIRMAN_BONUS.md)
- [COLS](variables/COLS.md)
- [MAX\_MAGE\_TARGETS](variables/MAX_MAGE_TARGETS.md)
- [MOVE\_COST](variables/MOVE_COST.md)
- [OBSERVE\_TIME](variables/OBSERVE_TIME.md)
- [PIECE\_DEFS](variables/PIECE_DEFS.md)
- [PLAYER\_TIME](variables/PLAYER_TIME.md)
- [PROMOTABLE](variables/PROMOTABLE.md)
- [RECT1\_RADIUS](variables/RECT1_RADIUS.md)
- [RECT2\_RADIUS](variables/RECT2_RADIUS.md)
- [RING\_RADIUS](variables/RING_RADIUS.md)
- [ROWS](variables/ROWS.md)
- [SECOND\_PLAYER\_BONUS](variables/SECOND_PLAYER_BONUS.md)
- [SETUP\_COUNTS](variables/SETUP_COUNTS.md)
- [SKILL\_COST](variables/SKILL_COST.md)
- [TICK\_MS](variables/TICK_MS.md)
- [TOTAL\_PIECES\_PER\_SIDE](variables/TOTAL_PIECES_PER_SIDE.md)

## Functions

- [aliveCount](functions/aliveCount.md)
- [cellsForAttackKind](functions/cellsForAttackKind.md)
- [cellsForMoveKind](functions/cellsForMoveKind.md)
- [checkWinner](functions/checkWinner.md)
- [computeAp](functions/computeAp.md)
- [createInitialState](functions/createInitialState.md)
- [createPiece](functions/createPiece.md)
- [dealDamage](functions/dealDamage.md)
- [emptyBoard](functions/emptyBoard.md)
- [endTurn](functions/endTurn.md)
- [getAttackCells](functions/getAttackCells.md)
- [getMageSkillCells](functions/getMageSkillCells.md)
- [getMoveCells](functions/getMoveCells.md)
- [getPiece](functions/getPiece.md)
- [getSkill](functions/getSkill.md)
- [getWarriorSkillCells](functions/getWarriorSkillCells.md)
- [hasChairmanAlive](functions/hasChairmanAlive.md)
- [inBoard](functions/inBoard.md)
- [isInAttackRange](functions/isInAttackRange.md)
- [isPrepCell](functions/isPrepCell.md)
- [listPieces](functions/listPieces.md)
- [listSkills](functions/listSkills.md)
- [movePiece](functions/movePiece.md)
- [nextId](functions/nextId.md)
- [opponent](functions/opponent.md)
- [pieceCell](functions/pieceCell.md)
- [pieceCount](functions/pieceCount.md)
- [playerLabel](functions/playerLabel.md)
- [prepRows](functions/prepRows.md)
- [rect2Cells](functions/rect2Cells.md)
- [reducer](functions/reducer.md)
- [registerPiece](functions/registerPiece.md)
- [registerSkill](functions/registerSkill.md)
- [removeDeadPieces](functions/removeDeadPieces.md)
- [ring2Cells](functions/ring2Cells.md)
