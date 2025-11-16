"""LLM-based natural language rule parser using Anthropic Claude."""

import json
import logging
import os
from enum import Enum
from pathlib import Path
from typing import Any

import anthropic
from pydantic import BaseModel, Field

# ==================== LOGGING SETUP ====================

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Configure LLM communication logger
llm_logger = logging.getLogger("llm_communication")
llm_logger.setLevel(logging.DEBUG)

# Clear existing handlers to avoid duplicates
llm_logger.handlers.clear()

# File handler - overwrites log file each session
llm_log_file = LOGS_DIR / "llm_communication.log"
file_handler = logging.FileHandler(llm_log_file, mode="w", encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(file_formatter)
llm_logger.addHandler(file_handler)

# Prevent propagation to root logger
llm_logger.propagate = False


# ==================== STRUCTURED SCHEMA FOR LLM OUTPUT ====================


class RuleHardness(str, Enum):
    """Whether the rule is mandatory or a soft constraint."""

    HARD = "hard"  # Must be satisfied, solver fails if violated
    SOFT = "soft"  # Optimization goal, can be violated if necessary


class RuleScope(str, Enum):
    """Who the rule applies to."""

    ALL = "all"  # All employees
    SPECIFIC_EMPLOYEE = "specific_employee"  # One specific employee
    EMPLOYEE_GROUP = "employee_group"  # Multiple specific employees
    QUALIFICATION_BASED = "qualification_based"  # Employees with certain qualifications


class TimeUnit(str, Enum):
    """Time unit for intervals and periods."""

    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class RecurrencePattern(str, Enum):
    """Pattern for recurring rules."""

    ONCE = "once"  # Single occurrence
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"  # Every two weeks
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"  # Custom pattern described in recurrence_description


class ConstraintType(str, Enum):
    """Type of constraint the rule represents."""

    UNAVAILABLE = "unavailable"  # Employee not available
    AVAILABLE_ONLY = "available_only"  # Only available for specific shifts
    PREFERRED = "preferred"  # Prefers certain shifts (soft)
    AVOID = "avoid"  # Wants to avoid certain shifts (soft)
    MAX_COUNT = "max_count"  # Maximum number of something
    MIN_COUNT = "min_count"  # Minimum number of something
    QUALIFICATION_GAINED = "qualification_gained"  # Employee gains qualification
    QUALIFICATION_LOST = "qualification_lost"  # Employee loses qualification
    CONSECUTIVE_LIMIT = "consecutive_limit"  # Max consecutive days/shifts
    REST_REQUIREMENT = "rest_requirement"  # Rest time between shifts
    FAIRNESS = "fairness"  # Fair distribution requirement
    CUSTOM = "custom"  # Custom constraint


class Weekday(str, Enum):
    """Days of the week."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class TimeFrame(BaseModel):
    """When the rule applies."""

    # Specific date or date range
    start_date: str | None = Field(
        None, description="ISO format date (YYYY-MM-DD) when rule starts"
    )
    end_date: str | None = Field(None, description="ISO format date (YYYY-MM-DD) when rule ends")

    # Recurring pattern
    is_recurring: bool = Field(False, description="Whether the rule repeats")
    recurrence_pattern: RecurrencePattern = Field(
        RecurrencePattern.ONCE, description="How often the rule repeats"
    )
    recurrence_interval: int | None = Field(
        None, description="Interval for custom recurrence (e.g., every 2 weeks)"
    )
    recurrence_unit: TimeUnit | None = Field(None, description="Unit for recurrence interval")
    recurrence_description: str | None = Field(
        None, description="Human-readable description of recurrence"
    )

    # Specific days
    specific_weekdays: list[Weekday] | None = Field(
        None, description="Specific weekdays the rule applies to"
    )

    # Duration/period reference
    duration_value: int | None = Field(None, description="Duration value (e.g., 2 for '2 weeks')")
    duration_unit: TimeUnit | None = Field(None, description="Duration unit")

    # Relative time
    is_permanent: bool = Field(False, description="Whether the rule is permanent/ongoing")


class ConstraintDetails(BaseModel):
    """Details about the specific constraint."""

    constraint_type: ConstraintType = Field(..., description="Type of constraint")

    # For count-based constraints
    count_value: int | None = Field(None, description="Numeric value for count constraints")
    count_unit: TimeUnit | None = Field(None, description="Time unit for count (per week/month)")
    count_subject: str | None = Field(
        None, description="What is being counted (shifts, weekends, night shifts)"
    )

    # For shift-specific constraints
    shift_names: list[str] | None = Field(None, description="Specific shift names involved")
    shift_categories: list[str] | None = Field(
        None, description="Shift categories (e.g., 'night', 'early')"
    )

    # For qualification constraints
    qualification_names: list[str] | None = Field(
        None, description="Qualifications gained/lost/required"
    )

    # For rest/consecutive constraints
    hours_value: float | None = Field(None, description="Hours for rest requirements")
    days_value: int | None = Field(None, description="Days for consecutive limits")

    # General description
    description: str = Field(..., description="Human-readable description of constraint")


class StructuredParsedRule(BaseModel):
    """Comprehensive structured output from LLM rule parsing."""

    # Original input
    original_text: str = Field(..., description="Original rule text as entered by user")

    # Rule classification
    rule_hardness: RuleHardness = Field(..., description="Hard (mandatory) or soft (optimization)")
    category: str = Field(
        ...,
        description="Category: Mitarbeiter-Einschränkung, Fairness-Ziel, Qualifikation, Arbeitszeitgesetz, Allgemein",
    )

    # Who it applies to
    scope: RuleScope = Field(..., description="Who the rule applies to")
    employee_names: list[str] | None = Field(
        None, description="Specific employee full names (if scope is specific)"
    )
    employee_initials: list[str] | None = Field(None, description="Employee initials/abbreviations")
    required_qualifications: list[str] | None = Field(
        None, description="Qualifications that define the group (if qualification_based)"
    )

    # When it applies
    time_frame: TimeFrame = Field(..., description="When the rule is active")

    # What the constraint is
    constraint: ConstraintDetails = Field(..., description="The actual constraint/requirement")

    # Parsing metadata
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score for parsing accuracy"
    )
    warnings: list[str] = Field(default_factory=list, description="Warnings about the rule")
    ambiguities: list[str] = Field(
        default_factory=list, description="Ambiguities that need clarification"
    )
    suggestions: list[str] = Field(
        default_factory=list, description="Suggestions for improving the rule"
    )

    # LLM feedback - for complaints about missing info, context issues, etc.
    llm_feedback: str | None = Field(
        None,
        description="LLM's feedback about issues with the rule or missing context (e.g., 'Employee not found', 'Date unclear')",
    )

    # Backward compatibility
    @property
    def rule_type(self) -> str:
        return self.rule_hardness.value

    @property
    def applies_to(self) -> str:
        if self.scope == RuleScope.ALL:
            return "all"
        elif self.employee_initials and len(self.employee_initials) == 1:
            return self.employee_initials[0]
        elif self.employee_initials:
            return ",".join(self.employee_initials)
        return "all"

    @property
    def employee_name(self) -> str | None:
        if self.employee_names and len(self.employee_names) > 0:
            return self.employee_names[0]
        return None

    @property
    def shift_name(self) -> str | None:
        if self.constraint.shift_names and len(self.constraint.shift_names) > 0:
            return self.constraint.shift_names[0]
        return None

    @property
    def day_constraint(self) -> str | None:
        if self.time_frame.specific_weekdays and len(self.time_frame.specific_weekdays) > 0:
            return self.time_frame.specific_weekdays[0].value.capitalize()
        return None

    @property
    def time_period(self) -> str | None:
        if self.time_frame.is_permanent:
            return "dauerhaft"
        elif self.time_frame.recurrence_pattern == RecurrencePattern.ONCE:
            return "einmalig"
        elif self.time_frame.recurrence_pattern == RecurrencePattern.WEEKLY:
            return "wöchentlich"
        elif self.time_frame.recurrence_pattern == RecurrencePattern.MONTHLY:
            return "monatlich"
        return "dauerhaft"

    @property
    def constraint_description(self) -> str:
        return self.constraint.description


# Legacy ParsedRule for backward compatibility
class ParsedRule(BaseModel):
    """Structured output from LLM rule parsing (legacy format)."""

    original_text: str
    rule_type: str = "soft"  # 'hard' or 'soft'
    category: str = "Allgemeine Regel"
    applies_to: str = "all"  # 'all' or specific employee initials
    employee_name: str | None = None
    shift_name: str | None = None
    day_constraint: str | None = None
    time_period: str | None = "dauerhaft"
    constraint_description: str = ""
    confidence: float = 0.5
    warnings: list[str] = Field(default_factory=list)
    ambiguities: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    llm_feedback: str | None = None  # LLM's feedback about issues


class RuleParserContext(BaseModel):
    """Context provided to the LLM for rule parsing."""

    employees: list[dict[str, Any]]
    shifts: list[dict[str, Any]]
    availability_codes: dict[str, str]
    existing_rules: list[dict[str, Any]] = Field(default_factory=list)


def create_system_prompt(context: RuleParserContext) -> str:
    """Create the system prompt with all context for the LLM."""

    # Format employees list with qualifications
    emp_list = []
    for emp in context.employees:
        quals = emp.get("qualifications", [])
        qual_str = f", Qualifikationen: {', '.join(quals)}" if quals else ""
        emp_list.append(f"  - {emp.get('name')} (Kürzel: {emp.get('initials')}{qual_str})")

    # Format shifts list
    shift_list = []
    for shift in context.shifts:
        reqs = shift.get("requirements", [])
        req_str = f", Anforderungen: {', '.join(reqs)}" if reqs else ""
        shift_list.append(
            f"  - {shift.get('name')}: {shift.get('description', 'Keine Beschreibung')} "
            f"(Zeit: {shift.get('time', 'N/A')}{req_str})"
        )

    # Format availability codes
    avail_list = [f"  - {code}: {desc}" for code, desc in context.availability_codes.items()]

    # Get list of all qualifications
    all_qualifications: set[str] = set()
    for emp in context.employees:
        all_qualifications.update(emp.get("qualifications", []))
    qual_list = sorted(all_qualifications) if all_qualifications else ["Keine definiert"]

    return f"""Du bist ein spezialisierter Parser für Dienstplanregeln in einem Krankenhaus-Roster-System.

KONTEXT - VORHANDENE MITARBEITER:
{chr(10).join(emp_list)}

KONTEXT - VERFÜGBARE SCHICHTEN:
{chr(10).join(shift_list)}

KONTEXT - BEKANNTE QUALIFIKATIONEN:
{chr(10).join(f"  - {q}" for q in qual_list)}

KONTEXT - VERFÜGBARKEITSCODES:
{chr(10).join(avail_list)}

DEINE AUFGABE:
1. Analysiere natürlichsprachliche Regeln für den Dienstplan
2. Identifiziere eindeutig, welche Mitarbeiter und Schichten gemeint sind
3. Erkenne Mehrdeutigkeiten (z.B. "Paul" wenn es Paul Müller und Paul Schmidt gibt)
4. Warne bei nicht existierenden Mitarbeitern oder Schichten
5. Gib strukturierte Ausgabe zurück

WICHTIGE VALIDIERUNGSREGELN:
- Wenn ein Name genannt wird, der NICHT in der Mitarbeiterliste ist → WARNUNG
- Wenn ein Name mehrdeutig ist (mehrere Mitarbeiter mit gleichem Vornamen) → AMBIGUITÄT
- Wenn eine Schicht genannt wird, die NICHT in der Schichtliste ist → WARNUNG
- Wenn eine Qualifikation genannt wird, die unbekannt ist → WARNUNG
- "Hart/MUSS/niemals" = hard constraint (Solver bricht ab bei Verletzung)
- "Weich/sollte/bevorzugt/möglichst" = soft constraint (Optimierungsziel)

ZULÄSSIGE ENUM-WERTE:

RuleScope: "all" | "specific_employee" | "employee_group" | "qualification_based"
RuleHardness: "hard" | "soft"
TimeUnit: "day" | "week" | "month" | "year"
RecurrencePattern: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom"
ConstraintType: "unavailable" | "available_only" | "preferred" | "avoid" | "max_count" | "min_count" | "qualification_gained" | "qualification_lost" | "consecutive_limit" | "rest_requirement" | "fairness" | "custom"
Weekday: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

AUSGABEFORMAT (STRIKT JSON - VERWENDE NUR DIE OBIGEN ENUM-WERTE):
{{
  "rule_hardness": "hard" oder "soft",
  "category": "Mitarbeiter-Einschränkung" | "Fairness-Ziel" | "Qualifikation" | "Arbeitszeitgesetz" | "Allgemein",
  "scope": "all" | "specific_employee" | "employee_group" | "qualification_based",
  "employee_names": ["Vollständiger Name"] oder null (muss exakt aus Mitarbeiterliste sein!),
  "employee_initials": ["Kürzel"] oder null (muss exakt aus Mitarbeiterliste sein!),
  "required_qualifications": ["Qualifikation"] oder null,
  "time_frame": {{
    "start_date": "YYYY-MM-DD" oder null,
    "end_date": "YYYY-MM-DD" oder null,
    "is_recurring": true/false,
    "recurrence_pattern": "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom",
    "recurrence_interval": Zahl oder null,
    "recurrence_unit": "day" | "week" | "month" | "year" oder null,
    "recurrence_description": "Beschreibung" oder null,
    "specific_weekdays": ["monday", "tuesday", ...] oder null,
    "duration_value": Zahl oder null,
    "duration_unit": "day" | "week" | "month" | "year" oder null,
    "is_permanent": true/false
  }},
  "constraint": {{
    "constraint_type": "unavailable" | "available_only" | "preferred" | "avoid" | "max_count" | "min_count" | "qualification_gained" | "qualification_lost" | "consecutive_limit" | "rest_requirement" | "fairness" | "custom",
    "count_value": Zahl oder null,
    "count_unit": "day" | "week" | "month" | "year" oder null,
    "count_subject": "Was gezählt wird" oder null,
    "shift_names": ["Schichtname"] oder null (muss exakt aus Schichtliste sein!),
    "shift_categories": ["Kategorie"] oder null,
    "qualification_names": ["Qualifikation"] oder null,
    "hours_value": Zahl oder null,
    "days_value": Zahl oder null,
    "description": "Kurze Beschreibung der Einschränkung"
  }},
  "confidence": 0.0-1.0,
  "warnings": ["Liste von Warnungen"],
  "ambiguities": ["Liste von Mehrdeutigkeiten"],
  "suggestions": ["Liste von Vorschlägen zur Klärung"],
  "llm_feedback": "Deine Anmerkungen zu Problemen, fehlenden Informationen oder Verbesserungsvorschlägen (z.B. 'Mitarbeiter nicht in Liste', 'Datum unklar', 'Kontext fehlt für Qualifikation') oder null wenn alles klar ist"
}}

BEISPIELE:

1. "Schmidt kann montags nicht arbeiten"
→ scope: "specific_employee", employee_names: ["Dr. Maria Schmidt"], specific_weekdays: ["monday"], constraint_type: "unavailable", is_permanent: true, is_recurring: true, recurrence_pattern: "weekly"

2. "Ab Mai hat Müller die Zertifizierung für Intensivstation"
→ scope: "specific_employee", start_date: "2025-05-01", constraint_type: "qualification_gained", qualification_names: ["Intensivstation"], is_permanent: true

3. "Jeder sollte maximal 2 Wochenenden pro Monat arbeiten"
→ scope: "all", rule_hardness: "soft", constraint_type: "max_count", count_value: 2, count_unit: "month", count_subject: "Wochenenden"

4. "Paul ist nächsten Mittwoch nicht verfügbar" (WENN ES MEHRERE PAULS GIBT)
→ ambiguities: ["Mehrere Mitarbeiter mit Vorname Paul gefunden: Paul Müller, Paul Schmidt. Bitte spezifizieren."]
"""


def convert_structured_to_legacy(structured: StructuredParsedRule) -> ParsedRule:
    """Convert new structured format to legacy ParsedRule format for backward compatibility."""
    return ParsedRule(
        original_text=structured.original_text,
        rule_type=structured.rule_type,
        category=structured.category,
        applies_to=structured.applies_to,
        employee_name=structured.employee_name,
        shift_name=structured.shift_name,
        day_constraint=structured.day_constraint,
        time_period=structured.time_period,
        constraint_description=structured.constraint_description,
        confidence=structured.confidence,
        warnings=structured.warnings,
        ambiguities=structured.ambiguities,
        suggestions=structured.suggestions,
        llm_feedback=structured.llm_feedback,
    )


def parse_structured_response(rule_text: str, parsed_data: dict) -> StructuredParsedRule:
    """Parse LLM JSON response into StructuredParsedRule."""
    # Parse time_frame
    time_frame_data = parsed_data.get("time_frame", {})

    # Convert weekday strings to Weekday enum
    specific_weekdays = None
    if time_frame_data.get("specific_weekdays"):
        specific_weekdays = [Weekday(day.lower()) for day in time_frame_data["specific_weekdays"]]

    # Parse recurrence pattern
    recurrence_pattern = RecurrencePattern.ONCE
    if time_frame_data.get("recurrence_pattern"):
        recurrence_pattern = RecurrencePattern(time_frame_data["recurrence_pattern"])

    # Parse recurrence unit
    recurrence_unit = None
    if time_frame_data.get("recurrence_unit"):
        recurrence_unit = TimeUnit(time_frame_data["recurrence_unit"])

    # Parse duration unit
    duration_unit = None
    if time_frame_data.get("duration_unit"):
        duration_unit = TimeUnit(time_frame_data["duration_unit"])

    time_frame = TimeFrame(
        start_date=time_frame_data.get("start_date"),
        end_date=time_frame_data.get("end_date"),
        is_recurring=time_frame_data.get("is_recurring", False),
        recurrence_pattern=recurrence_pattern,
        recurrence_interval=time_frame_data.get("recurrence_interval"),
        recurrence_unit=recurrence_unit,
        recurrence_description=time_frame_data.get("recurrence_description"),
        specific_weekdays=specific_weekdays,
        duration_value=time_frame_data.get("duration_value"),
        duration_unit=duration_unit,
        is_permanent=time_frame_data.get("is_permanent", False),
    )

    # Parse constraint
    constraint_data = parsed_data.get("constraint", {})

    # Parse constraint type
    constraint_type = ConstraintType.CUSTOM
    if constraint_data.get("constraint_type"):
        constraint_type = ConstraintType(constraint_data["constraint_type"])

    # Parse count unit
    count_unit = None
    if constraint_data.get("count_unit"):
        count_unit = TimeUnit(constraint_data["count_unit"])

    constraint = ConstraintDetails(
        constraint_type=constraint_type,
        count_value=constraint_data.get("count_value"),
        count_unit=count_unit,
        count_subject=constraint_data.get("count_subject"),
        shift_names=constraint_data.get("shift_names"),
        shift_categories=constraint_data.get("shift_categories"),
        qualification_names=constraint_data.get("qualification_names"),
        hours_value=constraint_data.get("hours_value"),
        days_value=constraint_data.get("days_value"),
        description=constraint_data.get("description", "Regel erkannt"),
    )

    # Parse scope
    scope = RuleScope.ALL
    if parsed_data.get("scope"):
        scope = RuleScope(parsed_data["scope"])

    # Parse rule hardness
    rule_hardness = RuleHardness.SOFT
    if parsed_data.get("rule_hardness"):
        rule_hardness = RuleHardness(parsed_data["rule_hardness"])

    return StructuredParsedRule(
        original_text=rule_text,
        rule_hardness=rule_hardness,
        category=parsed_data.get("category", "Allgemein"),
        scope=scope,
        employee_names=parsed_data.get("employee_names"),
        employee_initials=parsed_data.get("employee_initials"),
        required_qualifications=parsed_data.get("required_qualifications"),
        time_frame=time_frame,
        constraint=constraint,
        confidence=parsed_data.get("confidence", 0.5),
        warnings=parsed_data.get("warnings", []),
        ambiguities=parsed_data.get("ambiguities", []),
        suggestions=parsed_data.get("suggestions", []),
        llm_feedback=parsed_data.get("llm_feedback"),
    )


def parse_rules_with_llm(
    rule_texts: list[str], context: RuleParserContext, api_key: str | None = None
) -> list[ParsedRule]:
    """Parse natural language rules using Claude LLM.

    Args:
        rule_texts: List of natural language rule descriptions
        context: Context with employees, shifts, availability codes
        api_key: Optional API key (falls back to settings or env var)

    Returns:
        List of parsed rules with structured information
    """
    # Log session start
    llm_logger.info("=" * 80)
    llm_logger.info("NEW LLM PARSING SESSION STARTED")
    llm_logger.info("=" * 80)
    llm_logger.info(f"Number of rules to parse: {len(rule_texts)}")
    llm_logger.info(f"Context - Employees: {[e.get('name') for e in context.employees]}")
    llm_logger.info(f"Context - Shifts: {[s.get('name') for s in context.shifts]}")
    llm_logger.info(f"Context - Availability codes: {list(context.availability_codes.keys())}")

    if not api_key:
        # Try to get from settings first, then env var
        try:
            from config import settings

            api_key = settings.ANTHROPIC_API_KEY
        except ImportError:
            pass

        if not api_key:
            api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        llm_logger.error("ANTHROPIC_API_KEY not configured")
        raise ValueError(
            "ANTHROPIC_API_KEY nicht gesetzt. Bitte in .env Datei oder Umgebungsvariable konfigurieren."
        )

    client = anthropic.Anthropic(api_key=api_key)

    system_prompt = create_system_prompt(context)
    llm_logger.debug("System prompt created (length: %d chars)", len(system_prompt))

    parsed_rules = []

    for i, rule_text in enumerate(rule_texts, 1):
        llm_logger.info("-" * 60)
        llm_logger.info(f"PARSING RULE {i}/{len(rule_texts)}")
        llm_logger.info(f"Rule text: {rule_text}")

        user_message = f"""Analysiere diese Dienstplanregel:

"{rule_text}"

Gib die strukturierte Analyse als JSON zurück."""

        llm_logger.debug("User message sent to LLM")

        try:
            llm_logger.info("Calling Anthropic API...")
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )

            # Extract JSON from response
            response_text = message.content[0].text
            llm_logger.info("LLM Response received")
            llm_logger.debug("Raw LLM response:\n%s", response_text)

            # Try to parse JSON from response
            # Handle case where response might have markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
                llm_logger.debug("Extracted JSON from ```json block")
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
                llm_logger.debug("Extracted JSON from ``` block")
            else:
                json_str = response_text.strip()
                llm_logger.debug("Using raw response as JSON")

            llm_logger.debug("JSON string to parse:\n%s", json_str)

            parsed_data = json.loads(json_str)
            llm_logger.info("JSON parsed successfully")
            llm_logger.debug("Parsed data keys: %s", list(parsed_data.keys()))

            # Parse into new structured format first
            llm_logger.info("Converting to StructuredParsedRule...")
            structured_rule = parse_structured_response(rule_text, parsed_data)
            llm_logger.info(
                f"Structured rule created - Scope: {structured_rule.scope.value}, Confidence: {structured_rule.confidence}"
            )

            if structured_rule.warnings:
                llm_logger.warning(f"LLM warnings: {structured_rule.warnings}")
            if structured_rule.ambiguities:
                llm_logger.warning(f"LLM ambiguities: {structured_rule.ambiguities}")
            if structured_rule.llm_feedback:
                llm_logger.info(f"LLM feedback: {structured_rule.llm_feedback}")

            # Convert to legacy format for backward compatibility
            parsed_rule = convert_structured_to_legacy(structured_rule)
            llm_logger.info(f"Converted to legacy format - applies_to: {parsed_rule.applies_to}")

            parsed_rules.append(parsed_rule)
            llm_logger.info(f"Rule {i} parsed successfully")

        except json.JSONDecodeError as e:
            llm_logger.error(f"JSON parsing error: {str(e)}")
            llm_logger.error(f"Raw response that failed: {response_text[:500]}")
            # If JSON parsing fails, create a rule with warning
            parsed_rules.append(
                ParsedRule(
                    original_text=rule_text,
                    rule_type="soft",
                    category="Allgemeine Regel",
                    applies_to="all",
                    constraint_description="Regel konnte nicht vollständig analysiert werden",
                    confidence=0.1,
                    warnings=[
                        f"JSON-Parsing-Fehler: {str(e)}",
                        f"Rohantwort: {response_text[:200]}",
                    ],
                )
            )
        except (ValueError, KeyError) as e:
            llm_logger.error(f"Schema validation error: {str(e)}")
            # If enum parsing fails or structure is wrong
            parsed_rules.append(
                ParsedRule(
                    original_text=rule_text,
                    rule_type="soft",
                    category="Allgemeine Regel",
                    applies_to="all",
                    constraint_description="Regel konnte nicht vollständig analysiert werden",
                    confidence=0.2,
                    warnings=[f"Schema-Validierungsfehler: {str(e)}"],
                )
            )
        except anthropic.APIError as e:
            llm_logger.error(f"Anthropic API error: {str(e)}")
            parsed_rules.append(
                ParsedRule(
                    original_text=rule_text,
                    rule_type="soft",
                    category="Allgemeine Regel",
                    applies_to="all",
                    constraint_description="Regel konnte nicht analysiert werden",
                    confidence=0.0,
                    warnings=[f"API-Fehler: {str(e)}"],
                )
            )

    llm_logger.info("=" * 80)
    llm_logger.info(f"SESSION COMPLETED - {len(parsed_rules)} rules parsed")
    llm_logger.info("=" * 80)

    return parsed_rules


def validate_rule_references(parsed_rule: ParsedRule, context: RuleParserContext) -> ParsedRule:
    """Additional validation of parsed rule against context.

    This provides a second layer of validation after LLM parsing.
    """
    warnings = list(parsed_rule.warnings)
    ambiguities = list(parsed_rule.ambiguities)

    # Validate employee reference
    if parsed_rule.employee_name:
        matching_employees = [
            emp
            for emp in context.employees
            if emp.get("name", "").lower() == parsed_rule.employee_name.lower()
            or emp.get("initials", "").lower() == parsed_rule.applies_to.lower()
        ]

        if not matching_employees:
            warnings.append(
                f"Mitarbeiter '{parsed_rule.employee_name}' nicht in der Mitarbeiterliste gefunden"
            )
        elif len(matching_employees) > 1:
            ambiguities.append(
                f"Mehrere Mitarbeiter gefunden: {', '.join([str(e.get('name', '')) for e in matching_employees])}"
            )

    # Validate shift reference
    if parsed_rule.shift_name:
        matching_shifts = [
            s for s in context.shifts if s.get("name", "").lower() == parsed_rule.shift_name.lower()
        ]

        if not matching_shifts:
            warnings.append(
                f"Schicht '{parsed_rule.shift_name}' nicht in der Schichtliste gefunden"
            )

    # Update the rule with new warnings/ambiguities
    return ParsedRule(
        original_text=parsed_rule.original_text,
        rule_type=parsed_rule.rule_type,
        category=parsed_rule.category,
        applies_to=parsed_rule.applies_to,
        employee_name=parsed_rule.employee_name,
        shift_name=parsed_rule.shift_name,
        day_constraint=parsed_rule.day_constraint,
        time_period=parsed_rule.time_period,
        constraint_description=parsed_rule.constraint_description,
        confidence=parsed_rule.confidence * (0.8 if warnings else 1.0),
        warnings=warnings,
        ambiguities=ambiguities,
        suggestions=parsed_rule.suggestions,
        llm_feedback=parsed_rule.llm_feedback,
    )
