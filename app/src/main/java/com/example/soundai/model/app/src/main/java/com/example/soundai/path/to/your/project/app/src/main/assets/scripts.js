document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.querySelector('#sendButton');
    sendButton.addEventListener('click', sendMessage);

    const userInput = document.getElementById('userInput');
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    loadHistory(); // Load chat history
    applyTheme();  // Apply saved theme on load

    scrollToBottom(); // Scroll to bottom after loading the history

    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    const toggleFileUpload = document.getElementById('toggleFileUpload');
    toggleFileUpload.addEventListener('click', () => {
        const fileInput = document.getElementById('fileInput');
        fileInput.click();
    });

    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileUpload);

    const clearChatButton = document.getElementById('clearChat');
    clearChatButton.addEventListener('click', clearChat);

    const exportChatButton = document.getElementById('exportChat');
    exportChatButton.addEventListener('click', exportChat);
});

async function sendMessage() {
    const input = document.getElementById('userInput');
    const messagesDiv = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing-indicator');

    if (input.value.trim() === '') return;

    const userMessageContent = input.value.trim();
    input.value = '';

    const userMessage = `<div class="message user-message"><strong>You:</strong> ${escapeHtml(userMessageContent)}</div>\n`;
    appendMessage(userMessage);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (userMessageContent.toLowerCase().includes('stock') || 
        userMessageContent.toLowerCase().includes('company') || 
        userMessageContent.toLowerCase().includes('option') || 
        userMessageContent.toLowerCase().includes('index') || 
        userMessageContent.toLowerCase().includes('currency')) {
        const inputSymbolOrName = userMessageContent.split(' ').find(word => word.toLowerCase() === 'stock' || word.toLowerCase() === 'company' || word.toLowerCase() === 'option' || word.toLowerCase() === 'index' || word.toLowerCase() === 'currency');
        const symbolOrName = userMessageContent.replace(inputSymbolOrName, '').trim();
        const dataType = userMessageContent.includes('weekly') ? '1wk' :
            userMessageContent.includes('monthly') ? '1mo' : '1d';
        await showHistoricalData(symbolOrName, dataType);
        return;
    }

    try {
        typingIndicator.style.display = 'block';

        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessageContent })
        });

        typingIndicator.style.display = 'none';

        if (!response.ok) throw new Error('Failed to connect to the server.');

        const data = await response.json();
        if (data.error) throw new Error(`API Error: ${data.error}`);

        handleResponse(data.response);
        scrollToBottom();
    } catch (error) {
        appendMessage(`<div class="message assistant-message"><strong>Sound Marketing AI:</strong> ${escapeHtml(error.message)}. Please try again.</div>\n`);
        console.error('Error:', error.message);
    }
}

async function showHistoricalData(symbol, dataType = '1d') {
    console.log(`Fetching data for symbol: ${symbol} with interval: ${dataType}`);

    try {
        const response = await fetch('/getStockData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: symbol, interval: dataType })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.length === 0) {
            throw new Error('No data available');
        }

        const currentPrice = data[data.length - 1].close;
        const prediction = predictPrice(data);
        renderGoogleChart(symbol, data, currentPrice, prediction);

        if (prediction) {
            appendCurrentAndPredictedPriceMessage(symbol, currentPrice, prediction);
        }
    } catch (error) {
        appendMessage(`<div class="message assistant-message"><strong>Sound Marketing AI:</strong> ${escapeHtml(error.message)}. Please try again.</div>\n`);
        console.error('Error fetching data:', error.message);
    }
}

function predictPrice(data) {
    const N = 30;
    const recentData = data.slice(-N);

    if (recentData.length < 2) {
        console.log('Not enough data to make a prediction.');
        return null;
    }

    const x = [...Array(recentData.length).keys()];
    const y = recentData.map(entry => parseFloat(entry.close));

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / N;

    const nextPrice = slope * N + intercept;

    console.log(`Predicted next price: ${nextPrice.toFixed(2)}`);
    return nextPrice.toFixed(2);
}

function renderGoogleChart(symbol, data, currentPrice, predictedPrice) {
    google.charts.load('current', { packages: ['corechart', 'line'] });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        const dataTable = new google.visualization.DataTable();
        dataTable.addColumn('date', 'Date');
        dataTable.addColumn('number', 'Live Price');
        dataTable.addColumn('number', 'Predicted Price');

        const rows = data.map(entry => [new Date(entry.date), parseFloat(entry.close), null]);
        dataTable.addRows(rows);

        if (predictedPrice) {
            const lastDate = new Date(data[data.length - 1].date);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + 1);
            dataTable.addRow([nextDate, null, parseFloat(predictedPrice)]);
        }

        const options = {
            title: `${symbol.toUpperCase()} Price`,
            hAxis: { title: 'Date' },
            vAxis: { title: 'Close Price' },
            legend: 'bottom',
            series: {
                0: { color: '#e2431e' },  // Live price color
                1: { color: '#1c91c0', lineDashStyle: [4, 4] }  // Predicted price color with dashed line
            }
        };

        const messagesDiv = document.getElementById('messages');
        const chartDiv = document.createElement('div');
        chartDiv.className = 'message chart-message';
        const innerChartDiv = document.createElement('div');
        innerChartDiv.id = 'chart_div';
        chartDiv.appendChild(innerChartDiv);
        messagesDiv.appendChild(chartDiv);

        const chart = new google.visualization.LineChart(innerChartDiv);
        chart.draw(dataTable, options);

        saveToLocalStorage();
    }
}

function appendCurrentAndPredictedPriceMessage(symbol, currentPrice, predictedPrice) {
    const message = `<div class="message assistant-message"><strong>Sound Marketing AI:</strong> The current price for ${symbol.toUpperCase()} is $${currentPrice}. The predicted next price is $${predictedPrice}.</div>\n`;
    appendMessage(message);
    scrollToBottom();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleResponse(responseText) {
    try {
        console.log("Received Response:", responseText);

        if (responseText.includes("<html>")) {
            const container = document.createElement('div');
            container.innerHTML = responseText;

            document.getElementById('messages').appendChild(container);

            const scriptElements = container.querySelectorAll('script');
            scriptElements.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
                script.remove();
            });
        } else {
            const assistantMessage = `<div class="message assistant-message"><strong>Sound Marketing AI:</strong> ${escapeHtml(responseText)}</div>\n`;
            appendMessage(assistantMessage);
        }

        saveToLocalStorage();
    } catch (error) {
        console.error("Error processing response:", error.message);
        appendMessage(`<div class="message assistant-message">Error processing response. Please try again.</div>\n`);
    }
}

function saveToLocalStorage() {
    const chatHistory = document.getElementById('messages').innerHTML;
    localStorage.setItem('chatHistory', chatHistory);
}

function loadHistory() {
    const chatHistory = localStorage.getItem('chatHistory');
    if (chatHistory) {
        document.getElementById('messages').innerHTML = chatHistory;
    }
    scrollToBottom(); // Scroll to bottom after loading history
}

function scrollToBottom() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendMessage(message) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML += message;
    scrollToBottom();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}

function applyTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            let processedContent = '';
            if (file.type === 'application/pdf') {
                processedContent = await processPDFFile(e.target.result);
            } else {
                processedContent = "File type not supported for processing.";
            }

            appendMessage(`<div class="message user-message"><strong>You uploaded a file:</strong> ${escapeHtml(file.name)}</div>\n`);
            appendMessage(`<div class="message assistant-message"><strong>Sound Marketing AI:</strong> Processed content: ${escapeHtml(processedContent)}</div>\n`);
            saveToLocalStorage();
        };
        reader.readAsArrayBuffer(file);
    }
}

async function processPDFFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + ' ';
    }

    return text;
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat?')) {
        document.getElementById('messages').innerHTML = '';
        localStorage.removeItem('chatHistory');  // Clear the saved chat data
        saveToLocalStorage();
    }
}

function exportChat() {
    const chatHistory = localStorage.getItem('chatHistory');
    if (chatHistory) {
        const plainText = chatHistory.replace(/<div class="message user-message"><strong>You:<\/strong> /g, "You: ")
                                     .replace(/<div class="message assistant-message"><strong>Sound Marketing AI:<\/strong> /g, "Sound Marketing AI: ")
                                     .replace(/<\/div>/g, "\n\n")
                                     .replace(/<p>/g, '')
                                     .replace(/<\/p>/g, '\n')
                                     .replace(/<br\s*\/?>/gi, '\n')
                                     .replace(/<[^>]*>?/gm, '')
                                     .trim();

        const blob = new Blob([plainText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'chat_history.txt';
        link.click();
    } else {
        alert('No chat history to export.');
    }
}

