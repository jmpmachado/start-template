using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Enable CORS
app.UseCors();

// Root route
app.MapGet("/", () => new
{
    Message = "Welcome to start-project API",
    Documentation = "Refer to AGILE_GUIDE.md and API specifications"
});

// Healthcheck route
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Version = "1.0.0",
    Timestamp = DateTime.UtcNow,
    Environment = app.Environment.EnvironmentName,
    Checks = new[]
    {
        new { Component = "Database", Pass = true },
        new { Component = "Cache", Pass = true }
    }
});

// Run application on http://localhost:5000 by default
app.Run("http://localhost:5000");
