// Sample schedule data with initials - based on October 2025 roster
// Note: Only SR (Chefarzt) can work PP (Privatpatienten) shifts
export const scheduleData = {
  'SR': { '05': { shift: 'PP', station: 'Ambulanzen', locked: false }, '06': { shift: 'PP', station: 'Ambulanzen', locked: false }, '07': { shift: 'PP', station: 'Ambulanzen', locked: false }, '08': null, '09': { shift: 'PP', station: 'Ambulanzen', locked: false }, '10': { shift: 'PP', station: 'Ambulanzen', locked: false }, '11': null, '12': null, '13': { shift: 'PP', station: 'Ambulanzen', locked: false }, '14': { shift: 'PP', station: 'Ambulanzen', locked: false } },
  'DW': { '05': { shift: 'Rekrut', station: 'Forschung', locked: false }, '06': { shift: 'Rekrut', station: 'Forschung', locked: false }, '07': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '08': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '09': { shift: 'OA', station: 'Ambulanzen', locked: false }, '10': { shift: 'OA', station: 'Ambulanzen', locked: false }, '11': null, '12': null, '13': { shift: 'OA', station: 'Ambulanzen', locked: false }, '14': { shift: 'OA', station: 'Ambulanzen', locked: false } },
  'MM': { '05': { shift: '12-1818', station: 'Allgemein', locked: false }, '06': { shift: '12-1818', station: 'Allgemein', locked: false, violation: true }, '07': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '08': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '09': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '10': { shift: '12-1818', station: 'Allgemein', locked: true }, '11': null, '12': null, '13': { shift: '12-1818', station: 'Allgemein', locked: false }, '14': { shift: '12-1818', station: 'Allgemein', locked: false } },
  'DH': { '05': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '06': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '07': null, '08': { shift: 'BK', station: 'ABS', locked: false, violation: true }, '09': { shift: 'BK', station: 'ABS', locked: false }, '10': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '11': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '12': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '13': { shift: 'OA', station: 'Ambulanzen', locked: false }, '14': { shift: 'OA', station: 'Ambulanzen', locked: false } },
  'LA': { '05': null, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': null, '09': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '10': null, '11': null, '12': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '13': { shift: 'OA', station: 'Ambulanzen', locked: false }, '14': null },
  'CB': { '05': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '06': null, '07': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '08': { shift: 'PP Konsil', station: 'Konsiliardienst', locked: false }, '09': null, '10': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '11': null, '12': { shift: 'UKF Visite', station: 'Konsiliardienst', locked: false }, '13': null, '14': { shift: 'KD1', station: 'Konsiliardienst', locked: false } },
  'JC': { '05': null, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': null, '08': null, '09': null, '10': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '11': { shift: 'OA', station: 'Ambulanzen', locked: false }, '12': null, '13': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '14': { shift: '12-1818', station: 'Allgemein', locked: false } },
  'LD': { '05': { shift: 'BK', station: 'ABS', locked: false }, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '08': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '09': { shift: 'BK', station: 'ABS', locked: false }, '10': { shift: 'OA', station: 'Ambulanzen', locked: false }, '11': null, '12': { shift: 'BK', station: 'ABS', locked: false }, '13': null, '14': { shift: 'Allgem', station: 'Ambulanzen', locked: false } },
  'JF': { '05': { shift: 'UKF Visite', station: 'Konsiliardienst', locked: false }, '06': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '07': { shift: 'UKF Visite', station: 'Konsiliardienst', locked: false }, '08': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '09': null, '10': { shift: 'UKF FoBi', station: 'Konsiliardienst', locked: false }, '11': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '12': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '13': null, '14': { shift: 'UKF Visite', station: 'Konsiliardienst', locked: false } },
  'VG': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': null, '07': { shift: 'OA', station: 'Ambulanzen', locked: false }, '08': { shift: 'Reise', station: 'Ambulanzen', locked: false }, '09': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '10': null, '11': { shift: 'Allgem', station: 'Ambulanzen', locked: false, violation: true }, '12': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '13': { shift: 'Kongress', station: 'Sonstiges', locked: false }, '14': { shift: 'Kongress', station: 'Sonstiges', locked: false } },
  'RG': { '05': { shift: 'OA Station', station: 'Station v. Frer.', locked: false }, '06': null, '07': null, '08': { shift: 'OA', station: 'Ambulanzen', locked: false }, '09': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '10': { shift: 'OA Station', station: 'Station v. Frer.', locked: false }, '11': null, '12': null, '13': { shift: 'Rufbereitschaft', station: 'Allgemein', locked: false }, '14': null },
  'VH': { '05': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '06': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '07': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '08': null, '09': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '10': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '11': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '12': null, '13': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '14': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false } },
  'JH': { '05': null, '06': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '09': null, '10': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '11': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '12': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '13': null, '14': { shift: 'OA', station: 'Ambulanzen', locked: false } },
  'CK': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '07': null, '08': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '09': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '10': null, '11': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '12': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '13': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '14': null },
  'JK': { '05': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '08': null, '09': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '10': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '11': null, '12': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '13': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '14': { shift: 'Assistent', station: 'Station v. Frer.', locked: false } },
  'PK': { '05': null, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '09': null, '10': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '11': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '12': null, '13': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '14': { shift: 'KD3', station: 'Konsiliardienst', locked: false } },
  'KL': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': null, '07': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '08': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '09': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '10': null, '11': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '12': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '13': null, '14': { shift: 'KD1', station: 'Konsiliardienst', locked: false } },
  'LL': { '05': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': null, '08': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '09': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '10': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '11': null, '12': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '13': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '14': null },
  'ML': { '05': null, '06': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '09': null, '10': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '11': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '12': null, '13': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '14': { shift: 'KD3', station: 'Konsiliardienst', locked: false } },
  'LO': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '07': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '08': null, '09': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '10': null, '11': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '12': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '13': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '14': null },
  'PM': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': { shift: 'OA', station: 'Ambulanzen', locked: false }, '07': { shift: 'OA', station: 'Ambulanzen', locked: false }, '08': { shift: 'PPA', station: 'Forschung', locked: false }, '09': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '10': { shift: 'Reise', station: 'Ambulanzen', locked: false }, '11': null, '12': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '13': { shift: 'Rekrut', station: 'Forschung', locked: false }, '14': null },
  'AN': { '05': null, '06': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '07': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '08': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '09': null, '10': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '11': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '12': null, '13': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '14': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false } },
  'SP': { '05': { shift: 'OA', station: 'Ambulanzen', locked: false }, '06': { shift: 'OA', station: 'Ambulanzen', locked: false }, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': null, '09': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '10': { shift: 'OA', station: 'Ambulanzen', locked: false }, '11': { shift: 'Reise', station: 'Ambulanzen', locked: false }, '12': null, '13': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '14': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false } },
  'KS': { '05': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '06': null, '07': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '08': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '09': { shift: 'KD3', station: 'Konsiliardienst', locked: false }, '10': null, '11': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '12': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '13': null, '14': { shift: 'KD1', station: 'Konsiliardienst', locked: false } },
  'SW': { '05': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '06': { shift: 'KD1', station: 'Konsiliardienst', locked: false }, '07': null, '08': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '09': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '10': { shift: 'Assistent', station: 'Station v. Frer.', locked: false }, '11': null, '12': { shift: 'Myko/Echi/Notfall', station: 'Ambulanzen', locked: false }, '13': { shift: 'KD2', station: 'Konsiliardienst', locked: false }, '14': null },
  'DCW': { '05': { shift: 'Flü-Med 1', station: 'Ambulanzen', locked: false }, '06': { shift: 'OA', station: 'Ambulanzen', locked: false }, '07': { shift: 'OA', station: 'Ambulanzen', locked: false }, '08': { shift: 'Allgem', station: 'Ambulanzen', locked: false }, '09': null, '10': { shift: 'Flü-Med 2', station: 'Ambulanzen', locked: false }, '11': { shift: 'COVID/Impfen', station: 'Ambulanzen', locked: false }, '12': null, '13': { shift: 'OA', station: 'Ambulanzen', locked: false }, '14': { shift: 'Reise', station: 'Ambulanzen', locked: false } },
};

// Multi-unit schedule data - all stations
export const multiUnitData = {
  'Ambulanzen': {
    'SR': { '05': 'OA', '06': 'PP', '07': 'Allgem', '08': '', '09': '', '10': 'PP', '11': '', '12': '', '13': 'OA', '14': '' },
    'DW': { '05': 'PP', '06': 'OA', '07': '', '08': '', '09': 'PP', '10': '', '11': 'OA', '12': 'Myko/Echi/Notfall', '13': '', '14': 'PP' },
    'MM': { '05': 'Allgem', '06': '', '07': '', '08': 'OA', '09': '', '10': 'PP', '11': 'PP', '12': '', '13': 'Reise', '14': 'OA' },
    'DH': { '05': 'PP', '06': 'OA', '07': '', '08': '', '09': '', '10': '', '11': 'PP', '12': 'OA', '13': '', '14': '', violation: true },
    'LA': { '05': '', '06': 'PP', '07': 'Allgem', '08': '', '09': 'PP', '10': '', '11': '', '12': 'PP', '13': 'OA', '14': '' },
  },
  'Konsiliardienst': {
    'SR': { '05': '', '06': '', '07': '', '08': '', '09': 'OA Konsil', '10': '', '11': '', '12': '', '13': '', '14': '' },
    'MM': { '05': '', '06': '', '07': 'PP Konsil', '08': '', '09': '', '10': '', '11': '', '12': '', '13': '', '14': '' },
    'CB': { '05': 'KD1', '06': '', '07': 'KD2', '08': 'PP Konsil', '09': '', '10': '', '11': '', '12': 'UKF Visite', '13': '', '14': 'KD1' },
    'JF': { '05': 'UKF Visite', '06': 'KD3', '07': 'UKF Visite', '08': 'KD2', '09': '', '10': 'UKF FoBi', '11': 'KD1', '12': 'KD3', '13': '', '14': 'UKF Visite' },
    'VH': { '05': 'KD2', '06': '', '07': 'KD1', '08': '', '09': '', '10': 'KD3', '11': '', '12': '', '13': 'KD2', '14': '' },
  },
  'ABS': {
    'DH': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': '', '11': '', '12': '', '13': '', '14': 'BK' },
    'LD': { '05': 'BK', '06': '', '07': '', '08': '', '09': 'BK', '10': '', '11': '', '12': 'BK', '13': '', '14': '' },
  },
  'Station v. Frer.': {
    'SR': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': '', '11': '', '12': '', '13': '', '14': 'OA Station' },
    'DW': { '05': '', '06': '', '07': 'OA Station', '08': '', '09': '', '10': '', '11': '', '12': '', '13': '', '14': '' },
    'RG': { '05': 'OA Station', '06': '', '07': '', '08': '', '09': '', '10': 'OA Station', '11': '', '12': '', '13': '', '14': '' },
    'CB': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': 'Assistent', '11': '', '12': '', '13': '', '14': '' },
    'VH': { '05': '', '06': 'Assistent', '07': '', '08': '', '09': '', '10': '', '11': '', '12': '', '13': '', '14': '' },
  },
  'Allgemein (12-1818 / Rufbereitschaft)': {
    'SR': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': '', '11': 'Rufbereitschaft', '12': '', '13': '', '14': '' },
    'DH': { '05': '', '06': '', '07': '', '08': 'Rufbereitschaft', '09': '', '10': '', '11': '', '12': '', '13': '', '14': '' },
    'JC': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': 'Rufbereitschaft', '11': '', '12': '', '13': '', '14': '12-1818' },
    'RG': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': '', '11': '', '12': '', '13': 'Rufbereitschaft', '14': '' },
  },
  'Forschung': {
    'PM': { '05': '', '06': '', '07': '', '08': 'PPA', '09': '', '10': '', '11': '', '12': '', '13': 'Rekrut', '14': '' },
  },
  'Sonstiges (Urlaub/Kongress)': {
    'VG': { '05': '', '06': '', '07': '', '08': '', '09': '', '10': '', '11': '', '12': '', '13': 'Kongress', '14': 'Kongress' },
  },
};

// Excel-style view data - updated with all real data and employee initials
export const excelViewData = {
  '05': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'Rekrut' }, { initials: 'MM', shift: '12-1818' }, { initials: 'LD', shift: 'BK' }],
    'Konsiliardienst': [{ initials: 'CB', shift: 'KD1' }, { initials: 'JF', shift: 'UKF Visite' }, { initials: 'VH', shift: 'KD2' }],
    'ABS': [{ initials: 'LD', shift: 'BK' }],
    'Station v. Frer.': [{ initials: 'RG', shift: 'OA Station' }],
    'Allgemein': [],
    'Forschung': [],
    'Sonstiges': []
  },
  '06': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'Rekrut' }, { initials: 'MM', shift: '12-1818', violation: true }, { initials: 'LA', shift: 'Allgem' }, { initials: 'LD', shift: 'Allgem' }],
    'Konsiliardienst': [{ initials: 'JF', shift: 'KD3' }],
    'ABS': [],
    'Station v. Frer.': [{ initials: 'VH', shift: 'Assistent' }],
    'Allgemein': [],
    'Forschung': [],
    'Sonstiges': []
  },
  '07': {
    'Ambulanzen': [{ initials: 'SR', shift: 'Allgem' }, { initials: 'LA', shift: 'Allgem' }, { initials: 'LD', shift: 'Myko/Echi/Notfall' }],
    'Konsiliardienst': [{ initials: 'MM', shift: 'PP Konsil' }, { initials: 'CB', shift: 'KD2' }, { initials: 'JF', shift: 'UKF Visite' }, { initials: 'VH', shift: 'KD1' }],
    'ABS': [],
    'Station v. Frer.': [{ initials: 'DW', shift: 'OA Station' }],
    'Allgemein': [],
    'Forschung': [],
    'Sonstiges': []
  },
  '08': {
    'Ambulanzen': [{ initials: 'MM', shift: 'OA' }, { initials: 'LD', shift: 'Allgem' }, { initials: 'RG', shift: 'OA' }],
    'Konsiliardienst': [{ initials: 'CB', shift: 'PP Konsil' }, { initials: 'JF', shift: 'KD2' }],
    'ABS': [],
    'Station v. Frer.': [],
    'Allgemein': [{ initials: 'DH', shift: 'Rufbereitschaft', violation: true }],
    'Forschung': [{ initials: 'PM', shift: 'PPA' }],
    'Sonstiges': []
  },
  '09': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'OA' }, { initials: 'LA', shift: 'Allgem' }, { initials: 'MM', shift: 'Rufbereitschaft' }, { initials: 'RG', shift: 'COVID/Impfen' }],
    'Konsiliardienst': [{ initials: 'SR', shift: 'OA Konsil' }],
    'ABS': [{ initials: 'LD', shift: 'BK' }],
    'Station v. Frer.': [],
    'Allgemein': [],
    'Forschung': [],
    'Sonstiges': []
  },
  '10': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'OA' }, { initials: 'LD', shift: 'OA' }],
    'Konsiliardienst': [{ initials: 'VH', shift: 'KD3' }, { initials: 'JF', shift: 'UKF FoBi' }],
    'ABS': [],
    'Station v. Frer.': [{ initials: 'RG', shift: 'OA Station' }, { initials: 'CB', shift: 'Assistent' }],
    'Allgemein': [{ initials: 'JC', shift: 'Rufbereitschaft' }],
    'Forschung': [],
    'Sonstiges': []
  },
  '11': {
    'Ambulanzen': [{ initials: 'DW', shift: 'OA' }, { initials: 'MM', shift: '12-1818', locked: true }, { initials: 'VH', shift: 'Allgem' }, { initials: 'JC', shift: 'OA' }, { initials: 'VG', shift: 'Allgem', violation: true }],
    'Konsiliardienst': [{ initials: 'JF', shift: 'KD1' }],
    'ABS': [],
    'Station v. Frer.': [],
    'Allgemein': [{ initials: 'SR', shift: 'Rufbereitschaft' }],
    'Forschung': [],
    'Sonstiges': []
  },
  '12': {
    'Ambulanzen': [{ initials: 'DW', shift: 'Myko/Echi/Notfall' }, { initials: 'DH', shift: 'OA' }, { initials: 'LA', shift: 'Allgem' }],
    'Konsiliardienst': [{ initials: 'CB', shift: 'UKF Visite' }, { initials: 'JF', shift: 'KD3' }],
    'ABS': [{ initials: 'LD', shift: 'BK' }],
    'Station v. Frer.': [],
    'Allgemein': [],
    'Forschung': [],
    'Sonstiges': []
  },
  '13': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'OA' }, { initials: 'DH', shift: 'OA' }, { initials: 'MM', shift: 'Reise' }, { initials: 'LA', shift: 'OA' }, { initials: 'JC', shift: 'Allgem' }],
    'Konsiliardienst': [{ initials: 'VH', shift: 'KD2' }],
    'ABS': [],
    'Station v. Frer.': [],
    'Allgemein': [{ initials: 'RG', shift: 'Rufbereitschaft' }],
    'Forschung': [{ initials: 'PM', shift: 'Rekrut' }],
    'Sonstiges': [{ initials: 'VG', shift: 'Kongress' }]
  },
  '14': {
    'Ambulanzen': [{ initials: 'SR', shift: 'PP' }, { initials: 'DW', shift: 'OA' }, { initials: 'MM', shift: 'OA' }, { initials: 'LD', shift: 'Allgem' }, { initials: 'JH', shift: 'OA' }],
    'Konsiliardienst': [{ initials: 'CB', shift: 'KD1' }, { initials: 'JF', shift: 'UKF Visite' }],
    'ABS': [{ initials: 'DH', shift: 'BK' }],
    'Station v. Frer.': [{ initials: 'SR', shift: 'OA Station' }],
    'Allgemein': [{ initials: 'JC', shift: '12-1818' }],
    'Forschung': [],
    'Sonstiges': [{ initials: 'VG', shift: 'Kongress' }]
  },
};
