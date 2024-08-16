package com.example.soundai;

import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

import com.example.soundai.model.ChatService;
import com.example.soundai.model.ChatRequest;
import com.example.soundai.model.ChatResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private ChatService chatService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request to remove the Action Bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Set the activity to full-screen mode by hiding the status bar
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Set the content view for this activity
        setContentView(R.layout.activity_main);

        // Initialize WebView
        WebView webView = findViewById(R.id.webView);

        // Enable JavaScript (optional)
        webView.getSettings().setJavaScriptEnabled(true);

        // Load the index.html file from assets
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");

        // Initialize Retrofit for OpenAI GPT API
        Retrofit retrofitGPT = new Retrofit.Builder()
                .baseUrl("https://api.openai.com/") // OpenAI GPT API base URL
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        chatService = retrofitGPT.create(ChatService.class);

        // Example of another Retrofit instance for Yahoo Finance API
        Retrofit retrofitYahooFinance = new Retrofit.Builder()
                .baseUrl("https://yfapi.net/") // Yahoo Finance API base URL
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        // You can create another service interface for Yahoo Finance API if needed
        // YahooFinanceService yahooFinanceService = retrofitYahooFinance.create(YahooFinanceService.class);
    }

    private void sendMessage(String message) {
        ChatRequest request = new ChatRequest(message);

        chatService.sendMessage(request).enqueue(new Callback<ChatResponse>() {
            @Override
            public void onResponse(Call<ChatResponse> call, Response<ChatResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseMessage = response.body().getResponseMessage();
                    Log.d(TAG, "Received response: " + responseMessage);
                    // Update UI with the response message
                } else {
                    Log.e(TAG, "API Response failed: " + response.message());
                    // Handle the case where the response is not successful
                }
            }

            @Override
            public void onFailure(Call<ChatResponse> call, Throwable t) {
                Log.e(TAG, "API Call failed: " + t.getMessage());
                // Handle failure to connect to the API
            }
        });
    }
}
