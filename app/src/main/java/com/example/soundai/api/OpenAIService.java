package com.example.soundai.api;

import com.example.soundai.model.ChatResponse;
import com.example.soundai.model.ChatRequest;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface OpenAIService {

    @POST("your/api/endpoint")
    Call<ChatResponse> getChatResponse(@Body ChatRequest request);
}
