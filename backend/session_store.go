package guesser

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
)

// Session wraps a SessionState with an ID used by the frontend.
type Session struct {
	ID    string
	State SessionState
}

type sessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func newSessionStore() *sessionStore {
	return &sessionStore{
		sessions: make(map[string]*Session),
	}
}

func (s *sessionStore) create(initial SessionState) *Session {
	session := &Session{
		ID:    randomSessionID(),
		State: initial,
	}

	s.mu.Lock()
	s.sessions[session.ID] = session
	s.mu.Unlock()

	return session
}

func (s *sessionStore) get(id string) (*Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, ok := s.sessions[id]
	return session, ok
}

func randomSessionID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
