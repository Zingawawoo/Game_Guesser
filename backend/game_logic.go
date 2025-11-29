package guesser

import (
	"math/rand"
)

// -----------------------------
// Session creation
// -----------------------------

// NewSessionState picks a random secret game and initial candidate list.
func NewSessionState(idx GameIndex) SessionState {
	if len(idx.AllGameIDs) == 0 {
		// Edge case: no games at all.
		return SessionState{
			RemainingIDs: []int{},
			SecretID:     0,
		}
	}

	secretID := idx.AllGameIDs[rand.Intn(len(idx.AllGameIDs))]

	remaining := make([]int, len(idx.AllGameIDs))
	copy(remaining, idx.AllGameIDs)

	return SessionState{
		RemainingIDs: remaining,
		SecretID:     secretID,
	}
}

// -----------------------------
// Apply single question
// -----------------------------

// ApplyQuestion answers the question for the secret game and then
// filters the candidate list to only games that would give the same answer.
func ApplyQuestion(
	state SessionState,
	template QuestionTemplate,
	idx GameIndex,
	value string,
) (SessionState, bool) {
	secretGame := idx.Games[state.SecretID]

	var answer bool

	if template.CheckString != nil {
		answer = template.CheckString(secretGame, value)
	} else if template.CheckBool != nil {
		answer = template.CheckBool(secretGame)
	} else {
		// No logic defined: treat as false and do not change remaining IDs.
		return state, false
	}

	filtered := make([]int, 0, len(state.RemainingIDs))

	for _, id := range state.RemainingIDs {
		game := idx.Games[id]

		var match bool

		if template.CheckString != nil {
			match = template.CheckString(game, value)
		} else if template.CheckBool != nil {
			match = template.CheckBool(game)
		}

		if match == answer {
			filtered = append(filtered, id)
		}
	}

	state.RemainingIDs = filtered
	return state, answer
}

// -----------------------------
// Type builder for UI
// -----------------------------

// BuildQuestionTypeDefs strips out server-only logic and sends a
// lightweight description to the frontend.
func BuildQuestionTypeDefs(templates []QuestionTemplate) []QuestionTypeDef {
	result := make([]QuestionTypeDef, 0, len(templates))

	for _, t := range templates {
		def := QuestionTypeDef{
			ID:       t.ID,
			Category: t.Category,
			Values:   t.Values,
		}
		result = append(result, def)
	}

	return result
}
