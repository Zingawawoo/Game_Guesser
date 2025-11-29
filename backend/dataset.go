package guesser

import (
	"encoding/json"
	"os"
)

func LoadGamesJSON(path string) ([]Game, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var games []Game
	if err := json.Unmarshal(data, &games); err != nil {
		return nil, err
	}

	return games, nil
}
