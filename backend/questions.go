package guesser

import "strings"

// stringSliceContains performs a case-insensitive exact match search.
func stringSliceContains(slice []string, value string) bool {
	lowerValue := strings.ToLower(value)

	for _, item := range slice {
		if strings.ToLower(item) == lowerValue {
			return true
		}
	}

	return false
}

// scoreBucketRank orders score buckets so that we can do comparisons like
// "at least 80-89".
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

// ageRatingValue maps "3+", "7+", "12+", "16+", "18+" to numeric values.
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
