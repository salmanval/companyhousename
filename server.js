import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

if (process.env.NODE_ENV !== 'production') dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CH_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const CH_BASE = 'https://api.company-information.service.gov.uk';

// SIC code descriptions map (partial - common ones)
const SIC_DESCRIPTIONS = {
  '01110': 'Growing of cereals (except rice), leguminous crops and oil seeds',
  '41100': 'Development of building projects',
  '41201': 'Construction of commercial buildings',
  '41202': 'Construction of domestic buildings',
  '43210': 'Electrical installation',
  '45111': 'Sale of new cars and light motor vehicles',
  '46900': 'Non-specialised wholesale trade',
  '47110': 'Retail sale in non-specialised stores',
  '47190': 'Other retail sale in non-specialised stores',
  '49100': 'Passenger rail transport, interurban',
  '49320': 'Taxi operation',
  '55100': 'Hotels and similar accommodation',
  '56101': 'Licensed restaurants',
  '56102': 'Unlicensed restaurants and cafes',
  '56210': 'Event catering activities',
  '58110': 'Book publishing',
  '58190': 'Other publishing activities',
  '62011': 'Ready-made interactive leisure and entertainment software development',
  '62012': 'Business and domestic software development',
  '62020': 'Information technology consultancy activities',
  '62030': 'Computer facilities management activities',
  '62090': 'Other information technology service activities',
  '63110': 'Data processing, hosting and related activities',
  '63120': 'Web portals',
  '64110': 'Central banking',
  '64191': 'Banks',
  '64192': 'Building societies',
  '64910': 'Financial leasing',
  '64999': 'Other financial service activities, not elsewhere classified',
  '65110': 'Life insurance',
  '65120': 'Non-life insurance',
  '66110': 'Administration of financial markets',
  '66120': 'Security and commodity contracts dealership',
  '66190': 'Other activities auxiliary to financial services',
  '68100': 'Buying and selling of own real estate',
  '68209': 'Other letting and operating of own or leased real estate',
  '68310': 'Real estate agencies',
  '68320': 'Management of real estate on a fee or contract basis',
  '69101': 'Barristers at law',
  '69102': 'Solicitors',
  '69109': 'Activities of patent and copyright agents; other legal activities',
  '69201': 'Accounting and auditing activities',
  '69202': 'Bookkeeping activities',
  '69203': 'Tax consultancy',
  '70100': 'Activities of head offices',
  '70210': 'Public relations and communication activities',
  '70221': 'Financial management',
  '70229': 'Management consultancy activities (other than financial management)',
  '71111': 'Architectural activities',
  '71112': 'Urban planning and landscape architecture',
  '71121': 'Engineering design for industrial process and production',
  '71122': 'Engineering related scientific and technical consulting activities',
  '72110': 'Research and experimental development on biotechnology',
  '72190': 'Other research and experimental development on natural sciences',
  '72200': 'Research and experimental development on social sciences and humanities',
  '73110': 'Advertising agencies',
  '73120': 'Media representation services',
  '73200': 'Market research and public opinion polling',
  '74100': 'specialised design activities',
  '74201': 'Portrait photographic activities',
  '74202': 'Other specialist photography',
  '74203': 'Film processing',
  '74209': 'Photographic activities not elsewhere classified',
  '74300': 'Translation and interpretation activities',
  '74901': 'Environmental consulting activities',
  '74902': 'Quantity surveying activities',
  '74909': 'Other professional, scientific and technical activities',
  '77110': 'Renting and leasing of cars and light motor vehicles',
  '78100': 'Activities of employment placement agencies',
  '78200': 'Temporary employment agency activities',
  '78300': 'Other human resources provision',
  '79110': 'Travel agency activities',
  '79120': 'Tour operator activities',
  '80100': 'Private security activities',
  '81100': 'Combined facilities support activities',
  '81210': 'General cleaning of buildings',
  '82110': 'Combined office administrative service activities',
  '82190': 'Photocopying, document preparation and other specialised office support activities',
  '82200': 'Activities of call centres',
  '82300': 'Organisation of conventions and trade shows',
  '82910': 'Activities of collection agencies and credit bureaus',
  '82920': 'Packaging activities',
  '82990': 'Other business support service activities',
  '85100': 'Pre-primary education',
  '85200': 'Primary education',
  '85310': 'General secondary education',
  '85320': 'Technical and vocational secondary education',
  '85410': 'Post-secondary non-tertiary education',
  '85421': 'First-degree level higher education',
  '85422': 'Post-graduate level higher education',
  '85510': 'Sports and recreation education',
  '85520': 'Cultural education',
  '85590': 'Other education not elsewhere classified',
  '86101': 'Hospital activities',
  '86102': 'Medical nursing home activities',
  '86210': 'General medical practice activities',
  '86220': 'Specialists medical practice activities',
  '86230': 'Dental practice activities',
  '86900': 'Other human health activities',
  '87100': 'Residential nursing care activities',
  '87200': 'Residential care activities for learning disabilities, mental health and substance abuse',
  '87300': 'Residential care activities for the elderly and disabled',
  '88100': 'Social work activities without accommodation for the elderly and disabled',
  '88910': 'Child day-care activities',
  '90010': 'Performing arts',
  '90020': 'Support activities to performing arts',
  '90030': 'Artistic creation',
  '91011': 'Library activities',
  '91012': 'Archive activities',
  '91020': 'Museum activities',
  '92000': 'Gambling and betting activities',
  '93110': 'Operation of sports facilities',
  '93120': 'Activities of sport clubs',
  '93130': 'Fitness facilities',
  '93199': 'Other sports activities',
  '93210': 'Activities of amusement parks and theme parks',
  '93290': 'Other amusement and recreation activities',
  '94110': 'Activities of business and employers membership organisations',
  '94120': 'Activities of professional membership organisations',
  '94200': 'Activities of trade unions',
  '94910': 'Activities of religious organisations',
  '94920': 'Activities of political organisations',
  '94990': 'Activities of other membership organisations',
  '95110': 'Repair of computers and peripheral equipment',
  '95120': 'Repair of communication equipment',
  '96010': 'Washing and (dry-)cleaning of textile and fur products',
  '96020': 'Hairdressing and other beauty treatment',
  '96030': 'Funeral and related activities',
  '96040': 'Physical well-being activities',
  '96090': 'Other personal service activities',
  '99000': 'Activities of extraterritorial organisations and bodies',
};

function authHeader() {
  if (!CH_API_KEY) throw new Error('COMPANIES_HOUSE_API_KEY not set');
  return 'Basic ' + Buffer.from(CH_API_KEY + ':').toString('base64');
}

// Temporary debug endpoint - remove after testing
app.get('/api/debug', (req, res) => {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  res.json({
    key_set: !!key,
    key_length: key ? key.length : 0,
    key_preview: key ? key.slice(0, 8) + '...' : null,
    node_env: process.env.NODE_ENV,
  });
});

// Search by SIC code using advanced search
app.get('/api/search', async (req, res) => {
  const { sic, q, page = 1 } = req.query;
  const startIndex = (parseInt(page) - 1) * 20;

  if (!sic && !q) {
    return res.status(400).json({ error: 'Provide sic or q parameter' });
  }

  try {
    let url;
    if (sic) {
      // Use advanced company search with SIC code filter
      url = `${CH_BASE}/advanced-search/companies?sic_codes=${encodeURIComponent(sic)}&size=20&start_index=${startIndex}`;
    } else {
      // Search by keyword in the companies search
      url = `${CH_BASE}/search/companies?q=${encodeURIComponent(q)}&items_per_page=20&start_index=${startIndex}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: authHeader() },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Companies House API error: ${response.status}`, detail: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return the SIC descriptions map for autocomplete
app.get('/api/sic-codes', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(SIC_DESCRIPTIONS);

  const lower = q.toLowerCase();
  const filtered = Object.entries(SIC_DESCRIPTIONS)
    .filter(([code, desc]) => code.includes(q) || desc.toLowerCase().includes(lower))
    .slice(0, 20)
    .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

  res.json(filtered);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
