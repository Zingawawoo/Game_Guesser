#!/usr/bin/env python3
"""
build_games.py

Generate an enriched games.json dataset for the Guess-The-Game project.

- Fetches popular games (2010–2024) from the RAWG API.
- Filters out niche / low-visibility games.
- Derives a rich set of attributes from RAWG genres/tags/devs for
  better yes/no question variety.

Output: games.json (around 500 sampled games)
"""

from __future__ import annotations

import json
import os
import time
import re
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

import requests


# ------------------------------------------------------------
# 1. Data model
# ------------------------------------------------------------

@dataclass
class Game:
    id: int
    name: str
    year: int
    platforms: List[str]
    genres: List[str]
    main_genre: str

    perspective: str          # 1st / 3rd / Isometric / Side / Top-down / Unknown
    world_type: str           # Open World / Linear / Metroidvania / Level-based / etc.
    camera: str               # Mostly mirrors perspective, but kept separate

    theme: str                # Fantasy / Sci-Fi / Horror / Historical / etc.
    tone: List[str]           # Dark / Wholesome / Comedic / Emotional / Cute / Neutral
    difficulty: str           # Easy / Normal / Hard / Souls-like / Unknown
    replayability: str        # Roguelike / High / Medium / Low / Unknown

    developer_bucket: str     # Major studio bucket: FromSoftware, Rockstar, EA, etc.
    developer_region: str     # Japan / Europe / North America / Unknown
    franchise: str            # GTA / CoD / Soulsborne / etc.
    franchise_entry: str      # "1", "2", "III", "Unknown"

    esrb: str                 # E / E10+ / T / M / Unknown
    age_rating: str           # 3+ / 7+ / 12+ / 16+ / Unknown
    violence_level: str       # Low / Medium / High / Unknown

    visual_style: List[str]   # Pixel Art / Realistic / Anime / Retro / etc.
    combat_style: List[str]   # Melee / Guns / Magic / Stealth / Tactical / Unspecified
    structure_features: List[str]  # Crafting / Survival / Skill Tree / etc.
    mood: List[str]           # Atmospheric / Psychological / Story-Driven / etc.
    setting: List[str]        # Space / Underwater / Urban / Medieval / etc.
    monetization: List[str]   # Paid / F2P / Microtransactions / DLC-heavy / Seasonal

    multiplayer: bool
    co_op: bool
    online_only: bool
    multiplayer_mode: str     # Singleplayer / Online Co-op / MMO / Battle Royale / etc.

    score_bucket: str         # 90+ / 80-89 / 70-79 / 60-69 / <60 / Unknown


# ------------------------------------------------------------
# 2. Normalisation helpers
# ------------------------------------------------------------

PLATFORM_MAP: Dict[str, str] = {
    "PC": "PC",
    "Nintendo Switch": "Nintendo Switch",
    "PlayStation 3": "PlayStation",
    "PlayStation 4": "PlayStation",
    "PlayStation 5": "PlayStation",
    "PlayStation Vita": "PlayStation",
    "Xbox 360": "Xbox",
    "Xbox One": "Xbox",
    "Xbox Series S/X": "Xbox",
    "Android": "Mobile",
    "iOS": "Mobile",
}


def normalize_platforms(raw_platforms: List[str]) -> List[str]:
    """
    Map RAWG platform names to a small set of buckets:
    PC / PlayStation / Xbox / Nintendo Switch / Mobile
    """
    normalized: List[str] = []

    for p in raw_platforms:
        if p in PLATFORM_MAP:
            bucket: str = PLATFORM_MAP[p]
            if bucket not in normalized:
                normalized.append(bucket)
        else:
            lp: str = p.lower()
            if "pc" in lp or "windows" in lp:
                if "PC" not in normalized:
                    normalized.append("PC")
            elif "playstation" in lp or "ps4" in lp or "ps5" in lp or "ps3" in lp or "vita" in lp:
                if "PlayStation" not in normalized:
                    normalized.append("PlayStation")
            elif "xbox" in lp:
                if "Xbox" not in normalized:
                    normalized.append("Xbox")
            elif "switch" in lp or ("nintendo" in lp and "3ds" not in lp and "ds" not in lp):
                if "Nintendo Switch" not in normalized:
                    normalized.append("Nintendo Switch")
            elif "android" in lp or "ios" in lp or "mobile" in lp:
                if "Mobile" not in normalized:
                    normalized.append("Mobile")

    return normalized


def bucket_score(score: Optional[float]) -> str:
    """
    Place Metacritic-like numeric score into a score bucket.
    """
    if score is None:
        return "Unknown"

    if score >= 90.0:
        return "90+"
    if score >= 80.0:
        return "80-89"
    if score >= 70.0:
        return "70-79"
    if score >= 60.0:
        return "60-69"
    return "<60"


def to_lower_list(items: List[str]) -> List[str]:
    lowered: List[str] = []
    for item in items:
        lowered.append(item.lower())
    return lowered


# ------------------------------------------------------------
# 3. Classification helpers (theme / tone / style / etc.)
# ------------------------------------------------------------

def classify_theme(genres: List[str], tags: List[str]) -> str:
    g: List[str] = to_lower_list(genres)
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(g + t)

    if "horror" in joined or "zombie" in joined or "lovecraftian" in joined:
        return "Horror"
    if "post-apocalyptic" in joined or "post apocalypse" in joined or "nuclear" in joined or "wasteland" in joined:
        return "Post-Apocalyptic"
    if "sci-fi" in joined or "science fiction" in joined or "space" in joined or "cyberpunk" in joined or "futuristic" in joined:
        return "Sci-Fi"
    if "fantasy" in joined or "dragon" in joined or "magic" in joined or "medieval" in joined:
        return "Fantasy"
    if "ww2" in joined or "world war" in joined or "historical" in joined or "wwii" in joined:
        return "Historical"

    return "Modern / Other"


def classify_tone(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    tones: List[str] = []
    joined: str = " ".join(t)

    if "dark" in joined or "grim" in joined or "gothic" in joined:
        tones.append("Dark")
    if "wholesome" in joined or "relaxing" in joined or "cozy" in joined:
        tones.append("Wholesome")
    if "comedy" in joined or "funny" in joined or "humor" in joined:
        tones.append("Comedic")
    if "emotional" in joined or "story rich" in joined or "narrative" in joined:
        tones.append("Emotional")
    if "cute" in joined or "kawaii" in joined:
        tones.append("Cute")

    if len(tones) == 0:
        tones.append("Neutral")

    return tones


def classify_world_type(tags: List[str]) -> str:
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if "open world" in joined or "sandbox" in joined:
        return "Open World"
    if "metroidvania" in joined:
        return "Metroidvania"
    if "roguelike" in joined or "roguelite" in joined or "rogue-lite" in joined:
        return "Level-based"
    if "hub world" in joined or "hub-based" in joined:
        return "Hub-based"

    return "Linear / Mixed"


def classify_camera(genres: List[str], tags: List[str]) -> str:
    """
    Camera / perspective style inference, order matters:
    we prefer 3rd-person if both are present.
    """
    g: List[str] = to_lower_list(genres)
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(g + t)

    if "third-person" in joined or "third person" in joined or "tps" in joined:
        return "Third Person"
    if "first-person" in joined or "first person" in joined or "fps" in joined:
        return "First Person"
    if "isometric" in joined:
        return "Isometric"
    if "top-down" in joined or "top down" in joined:
        return "Top-down"
    if "side-scroller" in joined or "side scroller" in joined or "2d platformer" in joined:
        return "Side"

    return "Unknown"


def classify_perspective(genres: List[str], tags: List[str]) -> str:
    return classify_camera(genres, tags)


def classify_difficulty(tags: List[str]) -> str:
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if "souls-like" in joined or "soulslike" in joined or "souls-like" in joined:
        return "Souls-like"
    if "difficult" in joined or "hard" in joined or "challenging" in joined:
        return "Hard"
    if "casual" in joined or "relaxing" in joined:
        return "Easy"

    return "Normal / Unknown"


def classify_replayability(tags: List[str]) -> str:
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if "roguelike" in joined or "roguelite" in joined or "procedural generation" in joined or "procedurally generated" in joined:
        return "Roguelike"
    if "replay value" in joined or "replayable" in joined or "multiple endings" in joined or "choices matter" in joined:
        return "High"

    return "Medium / Low / Unknown"


def classify_visual_style(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    styles: List[str] = []
    joined: str = " ".join(t)

    if "pixel graphics" in joined or "pixel art" in joined:
        styles.append("Pixel Art")
    if "retro" in joined:
        styles.append("Retro")
    if "anime" in joined:
        styles.append("Anime")
    if "realistic" in joined:
        styles.append("Realistic")
    if "cartoon" in joined or "cartoony" in joined:
        styles.append("Cartoon")
    if "stylized" in joined:
        styles.append("Stylized")
    if "low poly" in joined:
        styles.append("Low Poly")
    if "minimalist" in joined:
        styles.append("Minimalist")

    if len(styles) == 0:
        styles.append("Unspecified")

    return styles


def classify_combat_style(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    combat: List[str] = []
    joined: str = " ".join(t)

    if "melee" in joined or "hand-to-hand" in joined or "sword" in joined or "swords" in joined:
        combat.append("Melee")
    if "gun" in joined or "guns" in joined or "shooter" in joined or "sniper" in joined or "fps" in joined:
        combat.append("Guns")
    if "magic" in joined or "spell" in joined or "wizard" in joined or "mage" in joined:
        combat.append("Magic")
    if "stealth" in joined or "sneak" in joined:
        combat.append("Stealth")
    if "strategy" in joined or "tactical" in joined or "turn-based" in joined:
        combat.append("Tactical")

    if len(combat) == 0:
        combat.append("Unspecified")

    return combat


def classify_structure_features(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    feats: List[str] = []
    joined: str = " ".join(t)

    if "crafting" in joined:
        feats.append("Crafting")
    if "survival" in joined:
        feats.append("Survival")
    if "skill tree" in joined or "character progression" in joined:
        feats.append("Skill Tree")
    if "loot" in joined or "loot-based" in joined:
        feats.append("Loot")
    if "base building" in joined or "building" in joined or "colony sim" in joined:
        feats.append("Base Building")
    if "procedural generation" in joined or "procedurally generated" in joined:
        feats.append("Procedural Generation")
    if "choices matter" in joined or "multiple endings" in joined:
        feats.append("Branching Story")

    if len(feats) == 0:
        feats.append("None / Standard")

    return feats


def classify_mood(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    moods: List[str] = []
    joined: str = " ".join(t)

    if "atmospheric" in joined:
        moods.append("Atmospheric")
    if "psychological" in joined:
        moods.append("Psychological")
    if "mystery" in joined:
        moods.append("Mysterious")
    if "thriller" in joined:
        moods.append("Thrilling")
    if "story rich" in joined or "narrative" in joined:
        moods.append("Story-Driven")
    if "relaxing" in joined or "wholesome" in joined or "cozy" in joined:
        moods.append("Relaxing")

    if len(moods) == 0:
        moods.append("Neutral")

    return moods


def classify_setting(genres: List[str], tags: List[str]) -> List[str]:
    g: List[str] = to_lower_list(genres)
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(g + t)
    settings: List[str] = []

    if "space" in joined or "planet" in joined:
        settings.append("Space / Sci-Fi")
    if "underwater" in joined or "ocean" in joined or "sea" in joined:
        settings.append("Underwater")
    if "city" in joined or "urban" in joined or "cyberpunk" in joined:
        settings.append("Urban")
    if "desert" in joined or "wasteland" in joined:
        settings.append("Desert / Wasteland")
    if "island" in joined:
        settings.append("Island")
    if "forest" in joined or "jungle" in joined or "wilderness" in joined:
        settings.append("Wilderness")
    if "medieval" in joined or "castle" in joined:
        settings.append("Medieval")
    if "post-apocalyptic" in joined or "post apocalypse" in joined:
        settings.append("Post-Apocalyptic")

    if len(settings) == 0:
        settings.append("Unspecified / Mixed")

    return settings


def classify_violence_level(tags: List[str]) -> str:
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if "gore" in joined or "gory" in joined or "blood" in joined or "brutal" in joined:
        return "High"
    if "violent" in joined or "violence" in joined or "combat" in joined or "shooter" in joined:
        return "Medium"
    if "non-violent" in joined or "peaceful" in joined:
        return "Low"

    return "Unknown / Varies"


def classify_developer_bucket(dev_names: List[str]) -> str:
    d: List[str] = to_lower_list(dev_names)
    joined: str = " ".join(d)

    if "fromsoftware" in joined:
        return "FromSoftware"
    if "rockstar" in joined:
        return "Rockstar"
    if "ubisoft" in joined:
        return "Ubisoft"
    if "electronic arts" in joined or "ea " in joined or " ea" in joined:
        return "EA"
    if "nintendo" in joined:
        return "Nintendo"
    if "square enix" in joined or "squaresoft" in joined:
        return "Square Enix"
    if "capcom" in joined:
        return "Capcom"
    if "cd projekt" in joined:
        return "CD PROJEKT"
    if "bethesda" in joined:
        return "Bethesda"

    return "Indie / Other"


def classify_developer_region(dev_names: List[str]) -> str:
    d: List[str] = to_lower_list(dev_names)
    joined: str = " ".join(d)

    if "fromsoftware" in joined or "capcom" in joined or "square enix" in joined or "nintendo" in joined or "bandai namco" in joined:
        return "Japan"
    if "ubisoft" in joined or "cd projekt" in joined or "larian" in joined:
        return "Europe"
    if "rockstar" in joined or "bethesda" in joined or "electronic arts" in joined or " ea" in joined:
        return "North America"

    return "Unknown / Various"


def detect_franchise(name: str) -> str:
    lower_name: str = name.lower()

    if "grand theft auto" in lower_name or "gta " in lower_name:
        return "Grand Theft Auto"
    if "call of duty" in lower_name:
        return "Call of Duty"
    if "assassin's creed" in lower_name or "assassins creed" in lower_name:
        return "Assassin's Creed"
    if "dark souls" in lower_name or "demon's souls" in lower_name or "demons souls" in lower_name or "bloodborne" in lower_name or "elden ring" in lower_name or "sekiro" in lower_name:
        return "Soulsborne"
    if "resident evil" in lower_name:
        return "Resident Evil"
    if "battlefield" in lower_name:
        return "Battlefield"
    if "the legend of zelda" in lower_name or lower_name.startswith("zelda"):
        return "The Legend of Zelda"
    if "final fantasy" in lower_name:
        return "Final Fantasy"
    if "far cry" in lower_name:
        return "Far Cry"
    if "halo" in lower_name:
        return "Halo"
    if "forza" in lower_name:
        return "Forza"
    if "fifa" in lower_name or "ea sports fc" in lower_name:
        return "FIFA / EA FC"

    return "Standalone / Other"


ROMAN_NUMERAL_PATTERN = re.compile(r"^([ivx]+)$", re.IGNORECASE)
TRAILING_NUMBER_PATTERN = re.compile(r"(\d+)$")


def detect_franchise_entry(name: str) -> str:
    stripped: str = name.strip()
    parts: List[str] = stripped.split()

    if len(parts) == 0:
        return "Unknown"

    last: str = parts[-1]

    match_num = TRAILING_NUMBER_PATTERN.search(last)
    if match_num is not None:
        return match_num.group(1)

    match_roman = ROMAN_NUMERAL_PATTERN.match(last)
    if match_roman is not None:
        return match_roman.group(1).upper()

    return "Unknown"


def classify_esrb(raw_esrb: Optional[Dict[str, Any]], tags: List[str]) -> str:
    """
    Use RAWG's esrb_rating if present; otherwise infer from violence/horror tags.
    """
    if raw_esrb is not None:
        name_value: Any = raw_esrb.get("name")
        slug_value: Any = raw_esrb.get("slug")

        name: str = ""
        slug: str = ""
        if name_value is not None:
            name = str(name_value)
        if slug_value is not None:
            slug = str(slug_value)

        text: str = (name + " " + slug).upper()

        if "EVERYONE 10" in text or "E10" in text:
            return "E10+"
        if "EVERYONE" in text or "E " in text:
            return "E"
        if "TEEN" in text or "T " in text:
            return "T"
        if "MATURE" in text or "M " in text:
            return "M"

    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if "gore" in joined or "gory" in joined or "blood" in joined or "brutal" in joined or "strong violence" in joined:
        return "M"
    if "horror" in joined or "violent" in joined or "violence" in joined:
        return "T"

    return "Unknown"


def esrb_to_age(esrb: str) -> str:
    if esrb == "E":
        return "3+"
    if esrb == "E10+":
        return "7+"
    if esrb == "T":
        return "12+"
    if esrb == "M":
        return "16+"

    return "Unknown"


def classify_multiplayer_mode(multiplayer: bool, co_op: bool, online_only: bool, tags: List[str]) -> str:
    t: List[str] = to_lower_list(tags)
    joined: str = " ".join(t)

    if not multiplayer and not co_op:
        return "Singleplayer"

    if "massively multiplayer" in joined or "mmo" in joined or "mmorpg" in joined:
        return "MMO"
    if "battle royale" in joined:
        return "Battle Royale"
    if "online pvp" in joined or "pvp" in joined:
        return "Competitive Online"
    if co_op:
        if "local co-op" in joined or "splitscreen" in joined or "split screen" in joined:
            return "Local Co-op"
        return "Online Co-op"
    if multiplayer:
        return "Multiplayer / Mixed"

    return "Unknown"


def classify_monetization(tags: List[str]) -> List[str]:
    t: List[str] = to_lower_list(tags)
    monetization: List[str] = []
    joined: str = " ".join(t)

    if "free to play" in joined or "free-to-play" in joined:
        monetization.append("Free to Play")
    if "in-app purchases" in joined or "microtransactions" in joined or "in app purchases" in joined:
        monetization.append("Microtransactions")
    if "dlc" in joined:
        monetization.append("DLC-heavy")
    if "season pass" in joined or "battle pass" in joined:
        monetization.append("Seasonal / Live Service")

    if len(monetization) == 0:
        monetization.append("Paid / Standard")

    return monetization


# ------------------------------------------------------------
# 4. RAWG API fetching
# ------------------------------------------------------------

RAWG_BASE_URL: str = "https://api.rawg.io/api/games"


def load_raw_games_from_api() -> List[Dict[str, Any]]:
    """
    Fetch multiple pages of games from RAWG, filtered by dates and popularity ordering.
    """
    api_key: Optional[str] = os.getenv("RAWG_API_KEY")
    if api_key is None or api_key == "":
        raise RuntimeError(
            "RAWG_API_KEY environment variable not set. "
            "Export RAWG_API_KEY before running this script."
        )

    raw_games: List[Dict[str, Any]] = []

    start_year: int = 2010
    end_year: int = 2024
    dates_param: str = f"{start_year}-01-01,{end_year}-12-31"

    page_size: int = 40
    max_pages: int = 30

    for page in range(1, max_pages + 1):
        params: Dict[str, Any] = {
            "key": api_key,
            "dates": dates_param,
            "ordering": "-added",
            "page_size": page_size,
            "page": page,
        }

        print(f"Fetching RAWG page {page}/{max_pages}...")
        resp = requests.get(RAWG_BASE_URL, params=params, timeout=15)
        if resp.status_code != 200:
            print(f"WARNING: RAWG request failed with status {resp.status_code}: {resp.text[:200]}")
            break

        data: Dict[str, Any] = resp.json()
        results_value: Any = data.get("results")
        if results_value is None:
            break

        results: List[Dict[str, Any]] = results_value
        if len(results) == 0:
            print("No more results, stopping pagination.")
            break

        for r in results:
            raw_games.append(r)

        time.sleep(0.2)

    print(f"Total raw games fetched from RAWG: {len(raw_games)}")
    return raw_games


# ------------------------------------------------------------
# 5. Transform RAWG data -> Game objects
# ------------------------------------------------------------

def transform_raw_to_games(raw_games: List[Dict[str, Any]]) -> List[Game]:
    games: List[Game] = []
    next_id: int = 1

    for raw in raw_games:
        # ----- Name -----
        name_value: Any = raw.get("name")
        if name_value is None:
            continue
        name: str = str(name_value).strip()
        if name == "":
            continue

        # ----- Release year -----
        released_value: Any = raw.get("released")
        if released_value is None:
            continue
        released: str = str(released_value)
        parts: List[str] = released.split("-")
        if len(parts) == 0:
            continue
        try:
            year: int = int(parts[0])
        except ValueError:
            continue

        if year < 2010:
            continue

        # ----- Popularity / ratings count -----
        ratings_count_value: Any = raw.get("ratings_count")
        if ratings_count_value is None:
            ratings_count: int = 0
        else:
            try:
                ratings_count = int(ratings_count_value)
            except ValueError:
                ratings_count = 0

        # Skip extremely niche games.
        if ratings_count < 500:
            continue

        # ----- Platforms -----
        raw_platforms_list_value: Any = raw.get("platforms")
        if raw_platforms_list_value is None:
            raw_platforms_list = []
        else:
            raw_platforms_list = raw_platforms_list_value

        raw_platform_names: List[str] = []
        for p in raw_platforms_list:
            plat_info_value: Any = p.get("platform")
            if plat_info_value is None:
                continue
            plat_info: Dict[str, Any] = plat_info_value
            plat_name_value: Any = plat_info.get("name")
            if plat_name_value is None:
                continue
            plat_name: str = str(plat_name_value)
            if plat_name != "":
                raw_platform_names.append(plat_name)

        platforms: List[str] = normalize_platforms(raw_platform_names)
        if len(platforms) == 0:
            continue

        # ----- Genres -----
        raw_genres_value: Any = raw.get("genres")
        if raw_genres_value is None:
            raw_genres = []
        else:
            raw_genres = raw_genres_value

        genre_names: List[str] = []
        for g in raw_genres:
            gname_value: Any = g.get("name")
            if gname_value is not None:
                genre_names.append(str(gname_value))

        main_genre: str = "Unknown"
        if len(genre_names) > 0:
            main_genre = genre_names[0]

        # ----- Tags -----
        raw_tags_value: Any = raw.get("tags")
        if raw_tags_value is None:
            raw_tags = []
        else:
            raw_tags = raw_tags_value

        tag_names: List[str] = []
        for t in raw_tags:
            tname_value: Any = t.get("name")
            if tname_value is not None:
                tag_names.append(str(tname_value))

        # ----- High-level classifications -----
        perspective: str = classify_perspective(genre_names, tag_names)
        camera: str = classify_camera(genre_names, tag_names)
        world_type: str = classify_world_type(tag_names)

        theme: str = classify_theme(genre_names, tag_names)
        tone: List[str] = classify_tone(tag_names)
        difficulty: str = classify_difficulty(tag_names)
        replayability: str = classify_replayability(tag_names)

        visual_style: List[str] = classify_visual_style(tag_names)
        combat_style: List[str] = classify_combat_style(tag_names)
        structure_features: List[str] = classify_structure_features(tag_names)
        mood: List[str] = classify_mood(tag_names)
        setting: List[str] = classify_setting(genre_names, tag_names)
        violence_level: str = classify_violence_level(tag_names)

        # ----- Multiplayer flags -----
        lowered_tags: List[str] = to_lower_list(tag_names)
        joined_tags: str = " ".join(lowered_tags)
        multiplayer: bool = False
        co_op: bool = False
        online_only: bool = False

        if "multiplayer" in joined_tags or "online co-op" in joined_tags or "online pvp" in joined_tags:
            multiplayer = True
        if "co-op" in joined_tags or "cooperative" in joined_tags:
            co_op = True
        if "online only" in joined_tags:
            online_only = True

        multiplayer_mode: str = classify_multiplayer_mode(multiplayer, co_op, online_only, tag_names)

        # ----- Score bucket -----
        meta_value: Any = raw.get("metacritic")
        score: Optional[float]
        if meta_value is None:
            score = None
        else:
            try:
                score = float(meta_value)
            except ValueError:
                score = None

        score_bucket: str = bucket_score(score)

        # ----- ESRB + Age -----
        esrb_raw_value: Any = raw.get("esrb_rating")
        if esrb_raw_value is None:
            esrb_raw = None
        else:
            esrb_raw = esrb_raw_value

        esrb: str = classify_esrb(esrb_raw, tag_names)
        age_rating: str = esrb_to_age(esrb)

        # ----- Developers -----
        raw_devs_value: Any = raw.get("developers")
        if raw_devs_value is None:
            raw_devs = []
        else:
            raw_devs = raw_devs_value

        dev_names: List[str] = []
        for d in raw_devs:
            dname_value: Any = d.get("name")
            if dname_value is not None:
                dev_names.append(str(dname_value))

        developer_bucket: str = classify_developer_bucket(dev_names)
        developer_region: str = classify_developer_region(dev_names)

        # ----- Franchise detection -----
        franchise: str = detect_franchise(name)
        franchise_entry: str = detect_franchise_entry(name)

        # ----- Monetization -----
        monetization: List[str] = classify_monetization(tag_names)

        # ----- Build final Game -----
        game: Game = Game(
            id=next_id,
            name=name,
            year=year,
            platforms=platforms,
            genres=genre_names,
            main_genre=main_genre,
            perspective=perspective,
            world_type=world_type,
            camera=camera,
            theme=theme,
            tone=tone,
            difficulty=difficulty,
            replayability=replayability,
            developer_bucket=developer_bucket,
            developer_region=developer_region,
            franchise=franchise,
            franchise_entry=franchise_entry,
            esrb=esrb,
            age_rating=age_rating,
            violence_level=violence_level,
            visual_style=visual_style,
            combat_style=combat_style,
            structure_features=structure_features,
            mood=mood,
            setting=setting,
            monetization=monetization,
            multiplayer=multiplayer,
            co_op=co_op,
            online_only=online_only,
            multiplayer_mode=multiplayer_mode,
            score_bucket=score_bucket,
        )

        games.append(game)
        next_id += 1

    return games


# ------------------------------------------------------------
# 6. Sampling + main entrypoint
# ------------------------------------------------------------

def sample_games(games: List[Game], target_size: int) -> List[Game]:
    import random

    if len(games) <= target_size:
        return games

    return random.sample(games, target_size)


def main() -> None:
    print("Loading raw games...")
    raw_games: List[Dict[str, Any]] = load_raw_games_from_api()
    print(f"Raw games count: {len(raw_games)}")

    transformed: List[Game] = transform_raw_to_games(raw_games)
    print(f"After filtering/transform: {len(transformed)}")

    final_games: List[Game] = sample_games(transformed, target_size=500)
    print(f"Final sample size: {len(final_games)}")

    data: List[Dict[str, Any]] = []
    for g in final_games:
        data.append(asdict(g))

    out_path: str = "games.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(final_games)} games to {out_path}")


if __name__ == "__main__":
    main()
