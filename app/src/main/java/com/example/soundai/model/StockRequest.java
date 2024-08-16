package com.example.soundai.model;

public class StockRequest {
    private String symbol;
    private String interval;

    public StockRequest(String symbol, String interval) {
        this.symbol = symbol;
        this.interval = interval;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getInterval() {
        return interval;
    }

    public void setInterval(String interval) {
        this.interval = interval;
    }
}

