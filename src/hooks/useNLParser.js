import { useState, useCallback } from 'react';
import { parseRulesWithLLM } from '../solver';

/**
 * Fallback local parser when LLM is unavailable
 */
const fallbackParse = (text, employees) => {
  const textLower = text.toLowerCase();
  const warnings = ['LLM-Parser nicht verfügbar, lokale Analyse verwendet'];

  let employeeName = null;
  employees.forEach(emp => {
    const nameLower = emp.name.toLowerCase();
    const firstNameLower = emp.name.split(' ').pop().toLowerCase();
    if (textLower.includes(nameLower) || textLower.includes(firstNameLower)) {
      employeeName = emp.name;
    }
  });

  const isNegative = textLower.includes('nicht') || textLower.includes('kein');
  const hardness = isNegative ? 'HART' : 'WEICH';

  return {
    original: text,
    understood: {
      type: employeeName ? 'Mitarbeiter-Einschränkung' : 'Allgemeine Regel',
      ...(employeeName && { Mitarbeiter: employeeName }),
      Einschränkung: 'Regel erkannt (vereinfachte Analyse)',
      Zeitraum: 'Unbegrenzt (dauerhaft)',
      Härte: hardness
    },
    confidence: 0.3,
    needsClarification: true,
    warnings: warnings,
    ambiguities: [],
    suggestions: ['LLM-Parser aktivieren für bessere Analyse']
  };
};

/**
 * Transform LLM response to UI format
 */
const transformLLMResponse = (rule) => ({
  original: rule.original_text,
  understood: {
    type: rule.category,
    ...(rule.employee_name && { Mitarbeiter: rule.employee_name }),
    ...(rule.shift_name && { Schicht: rule.shift_name }),
    Einschränkung: rule.constraint_description,
    ...(rule.day_constraint && { Tag: rule.day_constraint }),
    Zeitraum: rule.time_period === 'einmalig' ? 'Einmalig (dieser Zeitpunkt)' :
              rule.time_period === 'wöchentlich' ? 'Pro Woche' :
              rule.time_period === 'monatlich' ? 'Pro Monat' :
              'Unbegrenzt (dauerhaft)',
    Härte: rule.rule_type === 'hard' ? 'HART' : 'WEICH'
  },
  confidence: rule.confidence,
  needsClarification: rule.confidence < 0.7 || rule.ambiguities.length > 0,
  warnings: rule.warnings,
  ambiguities: rule.ambiguities,
  suggestions: rule.suggestions,
  applies_to: rule.applies_to
});

/**
 * Custom hook for NL parsing functionality
 * @returns {Object} NL parsing state and methods
 */
export const useNLParser = () => {
  const [isParsingRules, setIsParsingRules] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [ruleParsingError, setRuleParsingError] = useState(null);
  const [parsedRules, setParsedRules] = useState([]);
  const [showNlResults, setShowNlResults] = useState(false);

  const analyzeRules = useCallback(async (nlText, employees, shifts) => {
    setIsParsingRules(true);
    setRuleParsingError(null);
    setParsingStatus('Vorbereitung...');

    try {
      const lines = nlText.split('\n').filter(line => line.trim().length > 0);

      if (lines.length === 0) {
        setRuleParsingError('Bitte geben Sie mindestens eine Regel ein.');
        setIsParsingRules(false);
        setParsingStatus('');
        return false;
      }

      setParsingStatus(`Sende ${lines.length} Regel(n) an KI-Modell...`);

      // Small delay to show status message
      await new Promise(resolve => setTimeout(resolve, 100));

      setParsingStatus(`Analysiere mit Claude AI (${employees.length} Mitarbeiter, ${shifts.length} Schichten im Kontext)...`);

      const response = await parseRulesWithLLM({
        ruleTexts: lines,
        employees: employees,
        shifts: shifts
      });

      setParsingStatus('Validiere Ergebnisse...');

      const parsed = response.parsed_rules.map(transformLLMResponse);

      setParsedRules(parsed);
      setShowNlResults(true);
      setParsingStatus('');

      if (response.has_critical_issues) {
        setRuleParsingError(
          `${response.total_warnings} Warnung(en) und ${response.total_ambiguities} Mehrdeutigkeit(en) gefunden. Bitte überprüfen Sie die Regeln sorgfältig.`
        );
      }

      return true;
    } catch (error) {
      console.error('Rule parsing error:', error);
      setRuleParsingError(`Fehler beim Analysieren: ${error.message}`);
      setParsingStatus('Verwende lokalen Fallback-Parser...');

      // Fallback to simple local parser
      const lines = nlText.split('\n').filter(line => line.trim().length > 0);
      const parsed = lines.map(line => fallbackParse(line, employees));
      setParsedRules(parsed);
      setShowNlResults(true);

      return false;
    } finally {
      setIsParsingRules(false);
      setParsingStatus('');
    }
  }, []);

  const resetParser = useCallback(() => {
    setParsedRules([]);
    setShowNlResults(false);
    setRuleParsingError(null);
    setParsingStatus('');
  }, []);

  return {
    isParsingRules,
    parsingStatus,
    ruleParsingError,
    parsedRules,
    showNlResults,
    setShowNlResults,
    setParsedRules,
    analyzeRules,
    resetParser
  };
};

export default useNLParser;
