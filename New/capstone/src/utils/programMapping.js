/**
 * Program Code Mapping Utility
 * Maps backend database program codes to frontend display codes
 */

// Mapping from backend codes to display codes
export const PROGRAM_CODE_MAP = {
  'BSCS-DS': 'BSCS-DS',
  'BS-CYBER': 'BSCYSEC',
  'BSIT': 'BSIT',
  'BSPSY': 'BSPSYCH',
  'BAPSY': 'ABPSYCH',
  'BMA': 'BMMA',
  'ABCOMM': 'ABCOMM'
}

// Reverse mapping (display code to backend code)
export const DISPLAY_TO_BACKEND_MAP = {
  'BSCS-DS': 'BSCS-DS',
  'BSCYSEC': 'BS-CYBER',
  'BSIT': 'BSIT',
  'BSPSYCH': 'BSPSY',
  'ABPSYCH': 'BAPSY',
  'BMMA': 'BMA',
  'ABCOMM': 'ABCOMM'
}

// Program full names
export const PROGRAM_NAMES = {
  'BSCS-DS': 'Bachelor of Science in Computer Science - Data Science',
  'BSCYSEC': 'Bachelor of Science in Cybersecurity',
  'BSIT': 'Bachelor of Science in Information Technology',
  'BSPSYCH': 'Bachelor of Science in Psychology',
  'ABPSYCH': 'Bachelor of Arts in Psychology',
  'BMMA': 'Bachelor of Multimedia Arts',
  'ABCOMM': 'Bachelor of Arts in Communication'
}

/**
 * Convert backend program code to display code
 * @param {string} backendCode - The code from the database
 * @returns {string} - The display code
 */
export function toDisplayCode(backendCode) {
  if (!backendCode) return backendCode
  return PROGRAM_CODE_MAP[backendCode] || backendCode
}

/**
 * Convert display code to backend code
 * @param {string} displayCode - The display code
 * @returns {string} - The backend code
 */
export function toBackendCode(displayCode) {
  if (!displayCode) return displayCode
  return DISPLAY_TO_BACKEND_MAP[displayCode] || displayCode
}

/**
 * Transform program object to use display codes
 * @param {Object} program - Program object from API
 * @returns {Object} - Program object with display code
 */
export function transformProgram(program) {
  if (!program) return program
  
  const code = program.program_code || program.code
  const name = program.program_name || program.name
  
  return {
    ...program,
    code: toDisplayCode(code),
    program_code: toDisplayCode(code),
    displayCode: toDisplayCode(code),
    originalCode: code,
    name: name,
    program_name: name
  }
}

/**
 * Transform array of programs to use display codes
 * @param {Array} programs - Array of program objects
 * @returns {Array} - Array of transformed program objects
 */
export function transformPrograms(programs) {
  if (!Array.isArray(programs)) return programs
  return programs.map(transformProgram)
}

/**
 * Get display name for a program code
 * @param {string} code - Either backend or display code
 * @returns {string} - Full program name
 */
export function getDisplayName(code) {
  const displayCode = toDisplayCode(code)
  return PROGRAM_NAMES[displayCode] || code
}

export default {
  PROGRAM_CODE_MAP,
  DISPLAY_TO_BACKEND_MAP,
  PROGRAM_NAMES,
  toDisplayCode,
  toBackendCode,
  transformProgram,
  transformPrograms,
  getDisplayName
}
