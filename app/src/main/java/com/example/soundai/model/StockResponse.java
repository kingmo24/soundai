package com.example.soundai.model;

public class StockResponse {
    private String symbol;
    private double price;
    private String date;

    public StockResponse(String symbol, double price, String date) {
        this.symbol = symbol;
        this.price = price;
        this.date = date;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}

