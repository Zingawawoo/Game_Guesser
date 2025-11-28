package backend

import (
	"math/rand"
)

type AskedQuestion struct {
	TemplateID string `json:"template_id"`
	Label      string `json:"label"`
	Value      string `json:"value"`
	Answer     bool   `json:"answer"`
}

type SessionState struct {
	SecretID       int             `json:"secret_id"`        // only for debugging; do not send to client in production
	RemainingIDs   []int           `json:"remaining_ids"`    // still possible games
	Asked          []AskedQuestion `json:"asked"`            // question history
	GuessesLeft    int             `json:"guesses_left"`
	Status         string          `json:"status"`           // "playing", "won", "lost"
	RevealGameName string          `json:"reveal_game_name"` // filled when won/lost
}

type GameIndex struct {
	ByID map[int]Game
}

func NewGameIndex(games []Game) GameIndex {
	index := GameIndex{
		ByID: make(map[int]Game),
	}

	for _, g := range games {
		index.ByID[g.ID] = g
	}

	return index
}


func NewSession(games []Game) SessionState {
	remaining := make([]int, 0)
	for _, g := range games {
		remaining = append(remaining, g.ID)
	}

	secretIndex := rand.Intn(len(remaining))
	secretID := remaining[secretIndex]

	state := SessionState{
		SecretID:       secretID,
		RemainingIDs:   remaining,
		Asked:          []AskedQuestion{},
		GuessesLeft:    10,         // tune this
		Status:         "playing",  // "playing", "won", "lost"
		RevealGameName: "",
	}

	return state
}


func findTemplateByID(templates []QuestionTemplate, id string) (QuestionTemplate, bool) {
	for _, t := range templates {
		if t.ID == id {
			return t, true
		}
	}
	return QuestionTemplate{}, false
}

func FindGameByID(idx GameIndex, id int) (Game, bool) {
	g, ok := idx.ByID[id]
	return g, ok
}

func ApplyQuestion(
	state SessionState,
	templates []QuestionTemplate,
	idx GameIndex,
	req QuestionRequest,
) SessionState {
	if state.Status != "playing" {
		return state
	}

	tmpl, ok := findTemplateByID(templates, req.TemplateID)
	if !ok {
		return state
	}

	secretGame, ok := FindGameByID(idx, state.SecretID)
	if !ok {
		return state
	}

	answer := EvaluateQuestion(secretGame, tmpl, req.Value)

	// filter remaining IDs to those that would give the same answer
	newRemaining := make([]int, 0)
	for _, id := range state.RemainingIDs {
		g, okGame := FindGameByID(idx, id)
		if !okGame {
			continue
		}

		gameAnswer := EvaluateQuestion(g, tmpl, req.Value)
		if gameAnswer == answer {
			newRemaining = append(newRemaining, id)
		}
	}

	askedLabel := tmpl.Label
	// front-end will substitute {value}, but you can store raw + value for now

	newAsked := AskedQuestion{
		TemplateID: tmpl.ID,
		Label:      askedLabel,
		Value:      req.Value,
		Answer:     answer,
	}

	state.RemainingIDs = newRemaining
	state.Asked = append(state.Asked, newAsked)

	return state
}


type GuessRequest struct {
	GuessID   int    `json:"guess_id,omitempty"`
	GuessName string `json:"guess_name,omitempty"`
}

func NormalizeName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func ApplyGuess(
	state SessionState,
	idx GameIndex,
	req GuessRequest,
) SessionState {
	if state.Status != "playing" {
		return state
	}

	isCorrect := false

	secret, ok := FindGameByID(idx, state.SecretID)
	if !ok {
		return state
	}

	if req.GuessID != 0 {
		if req.GuessID == state.SecretID {
			isCorrect = true
		}
	} else {
		if NormalizeName(req.GuessName) == NormalizeName(secret.Name) {
			isCorrect = true
		}
	}

	if isCorrect {
		state.Status = "won"
		state.RevealGameName = secret.Name
		return state
	}

	state.GuessesLeft = state.GuessesLeft - 1
	if state.GuessesLeft <= 0 {
		state.Status = "lost"
		state.RevealGameName = secret.Name
	}

	return state
}
