package com.example.soundai;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

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
    }
}
