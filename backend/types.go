package backend

type Game struct {
	ID                int      `json:"id"`
	Name              string   `json:"name"`
	Year              int      `json:"year"`
	Platforms         []string `json:"platforms"`
	Genres            []string `json:"genres"`
	MainGenre         string   `json:"main_genre"`
	Perspective       string   `json:"perspective"`
	WorldType         string   `json:"world_type"`
	Camera            string   `json:"camera"`
	Theme             string   `json:"theme"`
	Tone              []string `json:"tone"`
	Difficulty        string   `json:"difficulty"`
	Replayability     string   `json:"replayability"`
	DeveloperBucket   string   `json:"developer_bucket"`
	DeveloperRegion   string   `json:"developer_region"`
	Franchise         string   `json:"franchise"`
	FranchiseEntry    string   `json:"franchise_entry"`
	ESRB              string   `json:"esrb"`
	AgeRating         string   `json:"age_rating"`
	ViolenceLevel     string   `json:"violence_level"`
	VisualStyle       []string `json:"visual_style"`
	CombatStyle       []string `json:"combat_style"`
	StructureFeatures []string `json:"structure_features"`
	Mood              []string `json:"mood"`
	Setting           []string `json:"setting"`
	Monetization      []string `json:"monetization"`
	Multiplayer       bool     `json:"multiplayer"`
	CoOp              bool     `json:"co_op"`
	OnlineOnly        bool     `json:"online_only"`
	MultiplayerMode   string   `json:"multiplayer_mode"`
	ScoreBucket       string   `json:"score_bucket"`
}

type QuestionTemplate struct {
	ID           string   `json:"id"`
	Category     string   `json:"category"`
	Label        string   `json:"label"`
	Field        string   `json:"field"`
	Type         string   `json:"type"`
	ValueSource  string   `json:"value_source,omitempty"`
	AllowedValues []string `json:"allowed_values,omitempty"`
}

type QuestionRequest struct {
	TemplateID string `json:"template_id"`
	Value      string `json:"value"` // may be empty for bool/custom types
}
