package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

// ---------------------------------
// Shared helper
// ---------------------------------

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

// ---------------------------------
// Request / response types
// ---------------------------------

type StartSessionResponse struct {
	SessionID       string            `json:"sessionId"`
	DatasetSize     int               `json:"datasetSize"`
	CandidatesCount int               `json:"candidatesCount"`
	QuestionTypes   []QuestionTypeDef `json:"questionTypes"`
}

type AskRequest struct {
	QuestionTypeID string `json:"questionTypeId"`
	Option         string `json:"option"`
}

type AskResponse struct {
	Answer          bool `json:"answer"`
	CandidatesCount int  `json:"candidatesCount"`
}

type GuessRequest struct {
	Guess string `json:"guess"`
}

type GuessResponse struct {
	Correct bool        `json:"correct"`
	Game    GameSummary `json:"game"`
}

// global in-memory session store
var store = newSessionStore()

// ---------------------------------
// /api/session/start   (POST)
// ---------------------------------

func StartSessionHandler(idx GameIndex, templates []QuestionTemplate) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		state := NewSessionState(idx)
		session := store.create(state)

		resp := StartSessionResponse{
			SessionID:       session.ID,
			DatasetSize:     len(idx.Games),
			CandidatesCount: len(state.RemainingIDs),
			QuestionTypes:   BuildQuestionTypeDefs(templates),
		}

		writeJSON(w, http.StatusOK, resp)
	})
}

// ---------------------------------
// /api/session/{sessionID}/...
//   - POST /ask
//   - POST /guess
// ---------------------------------

func SessionHandler(idx GameIndex, templates []QuestionTemplate) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip the prefix "/api/session/"
		path := strings.TrimPrefix(r.URL.Path, "/api/session/")
		if path == "" {
			http.NotFound(w, r)
			return
		}

		parts := strings.Split(path, "/")
		if len(parts) != 2 {
			http.NotFound(w, r)
			return
		}

		sessionID := parts[0]
		action := parts[1]

		session, ok := store.get(sessionID)
		if !ok {
			http.Error(w, "unknown session", http.StatusNotFound)
			return
		}

		switch action {
		case "ask":
			handleAsk(w, r, session, idx, templates)
		case "guess":
			handleGuess(w, r, session, idx)
		default:
			http.NotFound(w, r)
		}
	})
}

func handleAsk(
	w http.ResponseWriter,
	r *http.Request,
	session *Session,
	idx GameIndex,
	templates []QuestionTemplate,
) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	// Find the template by ID.
	var tmpl QuestionTemplate
	found := false

	for _, t := range templates {
		if t.ID == req.QuestionTypeID {
			tmpl = t
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "unknown questionTypeId", http.StatusBadRequest)
		return
	}

	newState, answer := ApplyQuestion(session.State, tmpl, idx, req.Option)
	session.State = newState

	resp := AskResponse{
		Answer:          answer,
		CandidatesCount: len(newState.RemainingIDs),
	}

	writeJSON(w, http.StatusOK, resp)
}

func handleGuess(
	w http.ResponseWriter,
	r *http.Request,
	session *Session,
	idx GameIndex,
) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GuessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	secret, ok := idx.Games[session.State.SecretID]
	if !ok {
		http.Error(w, "secret game not found", http.StatusInternalServerError)
		return
	}

	correct := strings.EqualFold(req.Guess, secret.Name)

	resp := GuessResponse{
		Correct: correct,
		Game: GameSummary{
			ID:   secret.ID,
			Name: secret.Name,
			Year: secret.Year,
		},
	}

	writeJSON(w, http.StatusOK, resp)
}
