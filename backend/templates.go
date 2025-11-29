package guesser

import "strconv"

// DefaultTemplates returns all question templates that the backend supports.
// The frontend chooses which IDs to expose / how to render them.
func DefaultTemplates() []QuestionTemplate {
	templates := []QuestionTemplate{
		// -----------------------
		// Release year questions
		// -----------------------
		{
			ID:       "year_at_least",
			Category: "Release Year",
			Values:   []string{"2010", "2012", "2015", "2018", "2020"},
			CheckString: func(g Game, v string) bool {
				year, err := strconv.Atoi(v)
				if err != nil {
					return false
				}
				return g.Year >= year
			},
		},
		{
			ID:       "year_at_most",
			Category: "Release Year",
			Values:   []string{"2012", "2015", "2018", "2020"},
			CheckString: func(g Game, v string) bool {
				year, err := strconv.Atoi(v)
				if err != nil {
					return false
				}
				return g.Year <= year
			},
		},

		// -----------------------
		// Genre / main genre
		// -----------------------
		{
			ID:       "main_genre",
			Category: "Main Genre",
			Values: []string{
				"Action", "RPG", "Shooter", "Indie", "Platformer", "Adventure",
				"Strategy", "Racing", "Casual", "Simulation",
			},
			CheckString: func(g Game, v string) bool {
				return g.MainGenre == v
			},
		},
		{
			ID:       "genre_includes",
			Category: "Genres",
			Values: []string{
				"Action", "RPG", "Shooter", "Indie", "Platformer", "Adventure",
				"Strategy", "Racing", "Casual", "Simulation",
			},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Genres, v)
			},
		},

		// -----------------------
		// Platforms
		// -----------------------
		{
			ID:       "platform_includes",
			Category: "Platforms",
			Values:   []string{"PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Platforms, v)
			},
		},

		// -----------------------
		// Perspective / camera / world
		// -----------------------
		{
			ID:       "perspective",
			Category: "Perspective",
			Values:   []string{"First Person", "Third Person", "Isometric", "Side", "Top-down", "Unknown"},
			CheckString: func(g Game, v string) bool {
				return g.Perspective == v
			},
		},
		{
			ID:       "world_type",
			Category: "World Type",
			Values:   []string{"Open World", "Metroidvania", "Level-based", "Hub-based", "Linear / Mixed"},
			CheckString: func(g Game, v string) bool {
				return g.WorldType == v
			},
		},
		{
			ID:       "camera",
			Category: "Camera",
			Values:   []string{"First Person", "Third Person", "Isometric", "Side", "Top-down", "Unknown"},
			CheckString: func(g Game, v string) bool {
				return g.Camera == v
			},
		},

		// -----------------------
		// Theme / tone / mood / setting
		// -----------------------
		{
			ID:       "theme",
			Category: "Theme",
			Values:   []string{"Fantasy", "Sci-Fi", "Horror", "Historical", "Post-Apocalyptic", "Modern / Other"},
			CheckString: func(g Game, v string) bool {
				return g.Theme == v
			},
		},
		{
			ID:       "tone",
			Category: "Tone",
			Values:   []string{"Dark", "Wholesome", "Comedic", "Emotional", "Cute", "Neutral"},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Tone, v)
			},
		},
		{
			ID:       "mood",
			Category: "Mood",
			Values: []string{
				"Atmospheric", "Story-Driven", "Psychological", "Relaxing",
				"Mysterious", "Neutral",
			},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Mood, v)
			},
		},
		{
			ID:       "setting",
			Category: "Setting",
			Values: []string{
				"Urban", "Medieval", "Space / Sci-Fi", "Wilderness", "Island",
				"Unspecified / Mixed",
			},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Setting, v)
			},
		},

		// -----------------------
		// Visual / combat / structure
		// -----------------------
		{
			ID:       "visual_style",
			Category: "Visual Style",
			Values: []string{
				"Pixel Art", "Retro", "Anime", "Realistic", "Cartoon", "Stylized",
				"Low Poly", "Minimalist", "Unspecified",
			},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.VisualStyle, v)
			},
		},
		{
			ID:       "combat_style",
			Category: "Combat Style",
			Values:   []string{"Melee", "Guns", "Magic", "Stealth", "Tactical", "Unspecified"},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.CombatStyle, v)
			},
		},
		{
			ID:       "structure_feature",
			Category: "Structure Features",
			Values: []string{
				"Crafting", "Survival", "Skill Tree", "Loot",
				"Procedural Generation", "Base Building", "Branching Story",
				"None / Standard",
			},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Structure, v)
			},
		},

		// -----------------------
		// Difficulty / replayability
		// -----------------------
		{
			ID:       "difficulty",
			Category: "Difficulty",
			Values:   []string{"Easy", "Normal / Unknown", "Hard", "Souls-like"},
			CheckString: func(g Game, v string) bool {
				return g.Difficulty == v
			},
		},
		{
			ID:       "replayability",
			Category: "Replayability",
			Values:   []string{"Roguelike", "High", "Medium / Low / Unknown"},
			CheckString: func(g Game, v string) bool {
				return g.Replayability == v
			},
		},

		// -----------------------
		// Multiplayer / co-op / online
		// -----------------------
		{
			ID:       "is_multiplayer",
			Category: "Multiplayer",
			Values:   nil, // pure yes/no
			CheckBool: func(g Game) bool {
				return g.Multiplayer
			},
		},
		{
			ID:       "has_coop",
			Category: "Co-op",
			Values:   nil,
			CheckBool: func(g Game) bool {
				return g.Coop
			},
		},
		{
			ID:       "is_online_only",
			Category: "Online-only",
			Values:   nil,
			CheckBool: func(g Game) bool {
				return g.OnlineOnly
			},
		},

		// -----------------------
		// Age rating / ESRB / violence
		// -----------------------
		{
			ID:       "age_at_least",
			Category: "Age Rating",
			Values:   []string{"3+", "7+", "12+", "16+", "18+"},
			CheckString: func(g Game, v string) bool {
				return ageRatingValue(g.AgeRating) >= ageRatingValue(v)
			},
		},
		{
			ID:       "esrb_category",
			Category: "ESRB",
			Values:   []string{"E", "E10+", "T", "M", "Unknown"},
			CheckString: func(g Game, v string) bool {
				return g.ESRB == v
			},
		},
		{
			ID:       "violence_level",
			Category: "Violence",
			Values:   []string{"Low", "Medium", "High", "Unknown / Varies"},
			CheckString: func(g Game, v string) bool {
				return g.Violence == v
			},
		},

		// -----------------------
		// Score bucket
		// -----------------------
		{
			ID:       "score_bucket_at_least",
			Category: "Score",
			Values:   []string{"60-69", "70-79", "80-89", "90+"},
			CheckString: func(g Game, v string) bool {
				return scoreBucketRank(g.Score) >= scoreBucketRank(v)
			},
		},

		// -----------------------
		// Monetization
		// -----------------------
		{
			ID:       "monetization",
			Category: "Monetization",
			Values:   []string{"Paid / Standard", "Free to Play", "Microtransactions", "DLC-heavy", "Seasonal"},
			CheckString: func(g Game, v string) bool {
				return stringSliceContains(g.Monetization, v)
			},
		},

		// -----------------------
		// Franchise-related
		// -----------------------
		{
			ID:       "is_sequel",
			Category: "Franchise",
			Values:   nil,
			CheckBool: func(g Game) bool {
				// Treat "Unknown" and empty as non-sequel.
				return g.FranchiseEntry != "" &&
					g.FranchiseEntry != "Unknown" &&
					g.FranchiseEntry != "1"
			},
		},
		{
			ID:       "has_franchise",
			Category: "Franchise",
			Values:   nil,
			CheckBool: func(g Game) bool {
				return g.Franchise != "" && g.Franchise != "Standalone / Other"
			},
		},
	}

	return templates
}
