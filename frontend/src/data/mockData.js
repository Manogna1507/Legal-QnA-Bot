// ============================================================
// NyayaAI — Mock Data
// ============================================================

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
];

export const DOCUMENT_TYPES = [
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'legal_notice', label: 'Legal Notice' },
  { value: 'complaint', label: 'Complaint / FIR Draft' },
  { value: 'bail_application', label: 'Bail Application' },
  { value: 'pil', label: 'Public Interest Litigation (PIL)' },
  { value: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'rent_agreement', label: 'Rent Agreement' },
  { value: 'power_of_attorney', label: 'Power of Attorney' },
];

export const CASE_LAW_FILTERS = [
  { value: 'all', label: 'All Sources' },
  { value: 'ipc', label: 'IPC' },
  { value: 'bns', label: 'BNS 2023' },
  { value: 'constitution', label: 'Constitution' },
  { value: 'supreme_court', label: 'Supreme Court' },
  { value: 'high_court', label: 'High Court' },
];

export const MOCK_CASES = [
  {
    id: 1,
    title: 'Maneka Gandhi v. Union of India',
    court: 'Supreme Court of India',
    year: 1978,
    citation: 'AIR 1978 SC 597',
    summary: 'Landmark ruling expanding Article 21 — Right to Life includes the right to live with human dignity and personal liberty. The court held that procedure established by law must be just, fair, and reasonable.',
    tags: ['Article 21', 'Personal Liberty', 'Fundamental Rights'],
    source: 'constitution',
    relevance: 98,
  },
  {
    id: 2,
    title: 'Vishaka v. State of Rajasthan',
    court: 'Supreme Court of India',
    year: 1997,
    citation: 'AIR 1997 SC 3011',
    summary: 'Established guidelines against sexual harassment at workplace, recognizing it as a violation of fundamental rights. These Vishaka Guidelines formed the basis for the POSH Act 2013.',
    tags: ['Sexual Harassment', 'Workplace Rights', 'POSH Act'],
    source: 'supreme_court',
    relevance: 95,
  },
  {
    id: 3,
    title: 'K.S. Puttaswamy v. Union of India',
    court: 'Supreme Court of India',
    year: 2017,
    citation: '(2017) 10 SCC 1',
    summary: 'Nine-judge bench unanimously held that the right to privacy is a fundamental right protected under Part III of the Constitution, intrinsic to right to life and personal liberty.',
    tags: ['Privacy', 'Article 21', 'Aadhaar'],
    source: 'constitution',
    relevance: 93,
  },
  {
    id: 4,
    title: 'State of Maharashtra v. Chandrabhan',
    court: 'Bombay High Court',
    year: 2022,
    citation: 'CRL.REV.APL. 440/2022',
    summary: 'Interpretation of Section 307 IPC (now BNS equivalent) — attempt to murder requires establishing intent beyond reasonable doubt through circumstances and nature of injuries.',
    tags: ['Section 307 IPC', 'Attempt to Murder', 'Intent'],
    source: 'ipc',
    relevance: 87,
  },
  {
    id: 5,
    title: 'Arnab Ranjan Goswami v. Union of India',
    court: 'Supreme Court of India',
    year: 2020,
    citation: 'W.P. (Crl.) No. 130/2020',
    summary: 'Court held that High Courts exercising jurisdiction under Article 226 must be ready to examine whether criminal law machinery is being set in motion maliciously.',
    tags: ['Article 226', 'Criminal Procedure', 'Liberty'],
    source: 'constitution',
    relevance: 82,
  },
];

export const MOCK_CHAT_HISTORY = [
  {
    id: 'c1',
    title: 'Rights during police custody',
    preview: 'What are my rights if I am detained by police?',
    timestamp: new Date(Date.now() - 3600000 * 2),
    messages: 8,
  },
  {
    id: 'c2',
    title: 'Tenant rights and eviction',
    preview: 'Can my landlord evict me without notice?',
    timestamp: new Date(Date.now() - 3600000 * 26),
    messages: 14,
  },
  {
    id: 'c3',
    title: 'Consumer complaint process',
    preview: 'How do I file a consumer complaint against a company?',
    timestamp: new Date(Date.now() - 3600000 * 72),
    messages: 6,
  },
  {
    id: 'c4',
    title: 'Domestic violence protection',
    preview: 'What legal protection is available under the Protection of Women Act?',
    timestamp: new Date(Date.now() - 86400000 * 5),
    messages: 11,
  },
  {
    id: 'c5',
    title: 'Property inheritance dispute',
    preview: 'How is property divided among legal heirs under Hindu Succession Act?',
    timestamp: new Date(Date.now() - 86400000 * 10),
    messages: 19,
  },
];

export const MOCK_INITIAL_MESSAGES = [
  {
    id: 'm0',
    role: 'assistant',
    content: "Hi there! I’m here to help you navigate Indian law. Whether you're curious about the new BNS rules, need help with legal terms, or want to understand your rights, I’ve got you covered.\nWhat can I help you explore today?",
    timestamp: new Date(),
    reasoning: null,
  },
];

export const SUGGESTED_QUESTIONS = [
  'What are my rights if arrested without a warrant?',
  'Explain Article 21 of the Constitution',
  'What is the difference between IPC and BNS?',
  'How do I file an RTI application?',
  'What constitutes a cognizable offence?',
];
