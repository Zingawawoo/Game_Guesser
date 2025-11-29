package guesser

// -----------------------------------------
// Game structure loaded from games.json
// -----------------------------------------

type Game struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Year int    `json:"year"`

	Platforms []string `json:"platforms"`
	Genres    []string `json:"genres"`
	MainGenre string   `json:"main_genre"`

	Perspective string `json:"perspective"`
	WorldType   string `json:"world_type"`
	Camera      string `json:"camera"`
	Theme       string `json:"theme"`

	Tone          []string `json:"tone"`
	Difficulty    string   `json:"difficulty"`
	Replayability string   `json:"replayability"`

	Developer       string `json:"developer_bucket"`
	DeveloperRegion string `json:"developer_region"`

	Franchise      string `json:"franchise"`
	FranchiseEntry string `json:"franchise_entry"`

	ESRB         string   `json:"esrb"`
	AgeRating    string   `json:"age_rating"`
	Violence     string   `json:"violence_level"`
	VisualStyle  []string `json:"visual_style"`
	CombatStyle  []string `json:"combat_style"`
	Structure    []string `json:"structure_features"`
	Mood         []string `json:"mood"`
	Setting      []string `json:"setting"`
	Monetization []string `json:"monetization"`

	Multiplayer     bool   `json:"multiplayer"`
	Coop            bool   `json:"co_op"`
	OnlineOnly      bool   `json:"online_only"`
	MultiplayerMode string `json:"multiplayer_mode"`

	// Optional: filled by builder if you cache RAWG images.
	ImageURL string `json:"image_url"`

	Score string `json:"score_bucket"`
}

// -----------------------------------------
// GameIndex: fast lookup
// -----------------------------------------

type GameIndex struct {
	Games      map[int]Game
	AllGameIDs []int
}

func NewGameIndex(list []Game) GameIndex {
	gameMap := make(map[int]Game)
	ids := make([]int, 0, len(list))

	for _, g := range list {
		gameMap[g.ID] = g
		ids = append(ids, g.ID)
	}

	return GameIndex{
		Games:      gameMap,
		AllGameIDs: ids,
	}
}

// -----------------------------------------
// GameSummary: minimal info sent to frontend
// -----------------------------------------

type GameSummary struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Year int    `json:"year"`
}

// -----------------------------------------
// Question types for the frontend
// -----------------------------------------

// QuestionTypeDef is the lightweight version sent to the client.
type QuestionTypeDef struct {
	ID       string   `json:"id"`
	Category string   `json:"category"`
	Values   []string `json:"values"`
}

// QuestionTemplate holds server-side logic for each question.
type QuestionTemplate struct {
	ID       string
	Category string
	Values   []string

	// If non-nil, the question expects a string value (e.g. "2015", "RPG").
	CheckString func(game Game, value string) bool

	// If non-nil, the question is a pure yes/no predicate on the game.
	CheckBool func(game Game) bool
}

// -----------------------------------------
// Session State
// -----------------------------------------

// SessionState tracks which candidates are still possible and which
// game is secretly the target.
type SessionState struct {
	RemainingIDs []int `json:"remaining"`
	SecretID     int   `json:"secret"`
}
