package backend

import (
	"strconv"
	"strings"
)

// Helper: case-insensitive contains in slice
func stringSliceContains(slice []string, value string) bool {
	lowerValue := strings.ToLower(value)

	for _, item := range slice {
		if strings.ToLower(item) == lowerValue {
			return true
		}
	}

	return false
}

// Helper: ordered score buckets
func scoreBucketRank(bucket string) int {
	switch bucket {
	case "60-69":
		return 1
	case "70-79":
		return 2
	case "80-89":
		return 3
	case "90+":
		return 4
	default:
		return 0
	}
}

// Helper: age "3+", "7+", etc.
func ageRatingValue(age string) int {
	switch age {
	case "3+":
		return 3
	case "7+":
		return 7
	case "12+":
		return 12
	case "16+":
		return 16
	case "18+":
		return 18
	default:
		return 0
	}
}

// Helpers to access fields by name (simple switch-based, explicit)

func getStringField(game Game, field string) string {
	switch field {
	case "main_genre":
		return game.MainGenre
	case "theme":
		return game.Theme
	case "perspective":
		return game.Perspective
	case "world_type":
		return game.WorldType
	case "camera":
		return game.Camera
	case "esrb":
		return game.ESRB
	case "age_rating":
		return game.AgeRating
	case "violence_level":
		return game.ViolenceLevel
	case "developer_bucket":
		return game.DeveloperBucket
	case "developer_region":
		return game.DeveloperRegion
	case "franchise":
		return game.Franchise
	case "franchise_entry":
		return game.FranchiseEntry
	case "multiplayer_mode":
		return game.MultiplayerMode
	case "score_bucket":
		return game.ScoreBucket
	default:
		return ""
	}
}

func getStringSliceField(game Game, field string) []string {
	switch field {
	case "platforms":
		return game.Platforms
	case "genres":
		return game.Genres
	case "tone":
		return game.Tone
	case "mood":
		return game.Mood
	case "visual_style":
		return game.VisualStyle
	case "combat_style":
		return game.CombatStyle
	case "structure_features":
		return game.StructureFeatures
	case "setting":
		return game.Setting
	case "monetization":
		return game.Monetization
	default:
		return []string{}
	}
}

func getIntField(game Game, field string) int {
	switch field {
	case "year":
		return game.Year
	default:
		return 0
	}
}

func getBoolField(game Game, field string) bool {
	switch field {
	case "multiplayer":
		return game.Multiplayer
	case "co_op":
		return game.CoOp
	case "online_only":
		return game.OnlineOnly
	default:
		return false
	}
}

// EvaluateQuestion returns true for YES, false for NO.
func EvaluateQuestion(game Game, tmpl QuestionTemplate, value string) bool {
	switch tmpl.Type {
	case "bool":
		return getBoolField(game, tmpl.Field)

	case "enum_equals":
		fieldValue := getStringField(game, tmpl.Field)
		return strings.EqualFold(fieldValue, value)

	case "enum_contains":
		slice := getStringSliceField(game, tmpl.Field)
		return stringSliceContains(slice, value)

	case "range_gt":
		fieldVal := getIntField(game, tmpl.Field)
		target, err := strconv.Atoi(value)
		if err != nil {
			return false
		}
		return fieldVal > target

	case "range_lt":
		fieldVal := getIntField(game, tmpl.Field)
		target, err := strconv.Atoi(value)
		if err != nil {
			return false
		}
		return fieldVal < target

	case "enum_ordered_min":
		fieldBucket := getStringField(game, tmpl.Field)
		fieldRank := scoreBucketRank(fieldBucket)
		valueRank := scoreBucketRank(value)
		if valueRank == 0 {
			return false
		}
		return fieldRank >= valueRank

	case "age_at_most":
		gameAge := ageRatingValue(game.AgeRating)
		targetAge := ageRatingValue(value)
		if targetAge == 0 {
			return false
		}
		if gameAge == 0 {
			// Unknown game age rating, be conservative: say NO
			return false
		}
		return gameAge <= targetAge

	case "custom_is_sequel":
		franchise := game.Franchise
		entry := game.FranchiseEntry

		if franchise == "Standalone / Other" {
			return false
		}

		if entry == "" || entry == "Unknown" {
			return false
		}

		if entry == "1" {
			return false
		}

		// Anything else counts as sequel
		return true

	default:
		return false
	}
}
