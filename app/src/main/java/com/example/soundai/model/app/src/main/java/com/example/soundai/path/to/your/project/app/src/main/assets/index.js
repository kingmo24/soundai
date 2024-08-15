import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yahooFinance from 'yahoo-finance2'; // Use Yahoo Finance API
import Chart from 'chart.js/auto';
import 'chartjs-adapter-luxon';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, '../public')));

// Mapping of Fortune 500 company names to stock symbols
const companyToSymbol = {
    'walmart': 'WMT',
    'amazon': 'AMZN',
    'apple': 'AAPL',
    'cvs health': 'CVS',
    'unitedhealth group': 'UNH',
    'berkshire hathaway': 'BRK.B',
    'mckesson': 'MCK',
    'amerisourcebergen': 'ABC',
    'alphabet': 'GOOGL',
    'exxon mobil': 'XOM',
    'at&t': 'T',
    'costco': 'COST',
    'cigna': 'CI',
    'cardinal health': 'CAH',
    'microsoft': 'MSFT',
    'walgreens boots alliance': 'WBA',
    'kroger': 'KR',
    'home depot': 'HD',
    'jpmorgan chase': 'JPM',
    'verizon': 'VZ',
    'ford motor': 'F',
    'chevron': 'CVX',
    'general motors': 'GM',
    'anthem': 'ANTM',
    'centene': 'CNC',
    'comcast': 'CMCSA',
    'phillips 66': 'PSX',
    'valero energy': 'VLO',
    'dell technologies': 'DELL',
    'bank of america': 'BAC',
    'target': 'TGT',
    'wells fargo': 'WFC',
    'citigroup': 'C',
    'pfizer': 'PFE',
    'metlife': 'MET',
    'pepsi': 'PEP',
    'coca-cola': 'KO',
    'walt disney': 'DIS',
    'intel': 'INTC',
    'ibm': 'IBM',
    'procter & gamble': 'PG',
    'honeywell': 'HON',
    'nvidia': 'NVDA',
    'lockheed martin': 'LMT',
    'raytheon technologies': 'RTX',
    'boeing': 'BA',
    'morgan stanley': 'MS',
    'charles schwab': 'SCHW',
    'goldman sachs': 'GS',
    'northrop grumman': 'NOC',
    'aig': 'AIG',
    'capital one': 'COF',
    'abbvie': 'ABBV',
    'bristol-myers squibb': 'BMY',
    'thermo fisher scientific': 'TMO',
    'altria': 'MO',
    'general electric': 'GE',
    'ups': 'UPS',
    '3m': 'MMM',
    'fedex': 'FDX',
    'starbucks': 'SBUX',
    'marriott international': 'MAR',
    'delta air lines': 'DAL',
    'american airlines': 'AAL',
    'southwest airlines': 'LUV',
    'united airlines': 'UAL',
    'hilton': 'HLT',
    'nike': 'NKE',
    'adobe': 'ADBE',
    'salesforce': 'CRM',
    'paypal': 'PYPL',
    'amgen': 'AMGN',
    'gilead sciences': 'GILD',
    'merck': 'MRK',
    't-mobile': 'TMUS',
    'dte energy': 'DTE',
    'duke energy': 'DUK',
    'pge': 'PCG',
    'exelon': 'EXC',
    'southern company': 'SO',
    'consolidated edison': 'ED',
    'dominion energy': 'D',
    'american express': 'AXP',
    'visa': 'V',
    'mastercard': 'MA',
    'broadcom': 'AVGO',
    'qualcomm': 'QCOM',
    'texas instruments': 'TXN',
    'western digital': 'WDC',
    'micron technology': 'MU',
    'oracle': 'ORCL',
    'hp': 'HPQ',
    'cisco': 'CSCO',
    'hewlett packard enterprise': 'HPE',
    'lenovo': '0992.HK',
    'panasonic': 'PCRFY',
    'sony': 'SONY',
    'hitachi': 'HTHIY',
    'samsung': 'SSNLF',
    'lg': 'LGEAF',
    'sharp': 'SHCAF',
    'philips': 'PHG',
    'toshiba': 'TOSYY',
    'siemens': 'SIEGY',
    'daikin': 'DKILY',
    'mitsubishi': 'MSBHF',
    'nec': 'NIPNF',
    'fujitsu': 'FJTSY',
    'taiwan semiconductor': 'TSM',
    'honda': 'HMC',
    'toyota': 'TM',
    'subaru': 'FUJHY',
    'mazda': 'MZDAY',
    'nissan': 'NSANY',
    'volkswagen': 'VWAGY',
    'bmw': 'BMWYY',
    'mercedes-benz': 'DDAIF',
    'hyundai': 'HYMTF',
    'kia': 'KIMTF'
    // Add more companies as needed
};

// Helper function to map user-friendly intervals to Yahoo Finance intervals
function mapInterval(userInterval) {
    switch (userInterval) {
        case 'daily':
            return '1d';
        case 'weekly':
            return '1wk';
        case 'monthly':
            return '1mo';
        default:
            return '1d';
    }
}

// Route to get stock data
app.post('/getStockData', async (req, res) => {
    const { symbol, interval } = req.body;

    try {
        // Define the date range for the stock data
        const period1 = Math.floor(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime() / 1000); // 1 year ago
        const period2 = Math.floor(Date.now() / 1000); // Current date/time

        // Map the user-friendly interval to Yahoo Finance's expected interval
        const mappedInterval = mapInterval(interval);

        const options = { period1, period2, interval: mappedInterval };

        // Fetch the stock data using Yahoo Finance API
        const result = await yahooFinance.historical(symbol, options);

        if (result.length === 0) {
            throw new Error(`No data available for symbol: ${symbol}`);
        }

        // Send the stock data as the response
        res.json(result);
    } catch (error) {
        console.error('Error fetching stock data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Route to handle chat requests
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    const symbol = companyToSymbol[userMessage.split(' ').pop().toLowerCase()] || userMessage.toUpperCase();

    try {
        if (userMessage.includes('stock') || userMessage.includes('company')) {
            const interval = mapInterval(userMessage.includes('weekly') ? 'weekly' :
                userMessage.includes('monthly') ? 'monthly' : 'daily');

            const period1 = Math.floor(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime() / 1000); // 1 year ago
            const period2 = Math.floor(Date.now() / 1000); // Current date/time

            const data = await yahooFinance.historical(symbol, { period1, period2, interval });

            res.json({ response: `Here is the stock data for ${symbol}:`, data });
        } else {
            const fileContent = req.files && req.files.file ? await readUploadedFile(req.files.file) : '';
            const prompt = `User message: ${userMessage}\n\nFile content:\n${fileContent}`;
            const payload = {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that works for Sound Marketing Inc., and displays chats and tables in HTML.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 3000,
            };

            const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            res.json({ response: response.data.choices[0].message.content });
        }
    } catch (error) {
        console.error('Error processing request:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Function to read uploaded files
async function readUploadedFile(file) {
    const fileType = file.mimetype;
    console.log('Detected file type:', fileType);

    switch (fileType) {
        case 'application/pdf':
            console.log('Processing PDF file...');
            return await processPDF(file);
        case 'text/plain':
            console.log('Processing Text file...');
            return file.data.toString('utf8');
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            console.log('Processing Word file...');
            return await processWord(file);
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            console.log('Processing Excel file...');
            return await processExcel(file);
        case 'image/jpeg':
        case 'image/png':
        case 'image/jpg':
            console.log('Processing Image file...');
            return await processImage(file);
        default:
            throw new Error('Unsupported file type');
    }
}

// Helper functions to process different file types
async function processPDF(file) {
    const data = new Uint8Array(file.data);
    const pdf = await getDocument({ data }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + ' ';
    }

    return text;
}

async function processWord(file) {
    const result = await mammoth.extractRawText({ buffer: file.data });
    return result.value;
}

async function processExcel(file) {
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    let text = '';

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += `${XLSX.utils.sheet_to_csv(worksheet)}\n`;
    });

    return text;
}

async function processImage(file) {
    return Tesseract.recognize(file.data, 'eng', { logger: m => console.log(m) })
        .then(({ data: { text } }) => text)
        .catch(err => { throw err });
}

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

