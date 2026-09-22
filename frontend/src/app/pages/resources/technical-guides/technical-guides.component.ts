import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-technical-guides',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200">
      <div class="max-w-5xl mx-auto space-y-10">
        
        <!-- Header -->
        <div class="space-y-4">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Technical Mastery
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Technical Mock Interview Guides
          </h1>
          <p class="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-3xl leading-relaxed">
            Architectural frameworks, Data Structures & Algorithms cheat sheets, and System Design strategies compiled by principal tech interviewers.
          </p>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                ⚡
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">Data Structures & Algorithms</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Master Big-O time complexity analysis, dynamic programming state transitions, sliding window patterns, and graph traversals.
              </p>
            </div>
            <ul class="text-xs text-indigo-600 dark:text-indigo-400 font-medium space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <li>• Two Pointers & Fast/Slow Pointers</li>
              <li>• Monotonic Stacks & Binary Search</li>
              <li>• BFS / DFS & Dijkstra's Algorithm</li>
            </ul>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 text-2xl font-bold">
                🏗️
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">System Design & Architecture</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Learn how to design scalable distributed services, message queues (Kafka, RabbitMQ), caching layers (Redis), and database sharding.
              </p>
            </div>
            <ul class="text-xs text-purple-600 dark:text-purple-400 font-medium space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <li>• High Availability & Load Balancing</li>
              <li>• CAP Theorem & Consistent Hashing</li>
              <li>• Rate Limiting & API Gateways</li>
            </ul>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 text-2xl font-bold">
                💻
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">Live Code Evaluation Tips</h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Communicate your thought process clearly while coding. Handle edge cases, write test assertions, and refactor cleanly.
              </p>
            </div>
            <ul class="text-xs text-blue-600 dark:text-blue-400 font-medium space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <li>• Clarify Problem Boundaries First</li>
              <li>• State Assumptions & Space Limits</li>
              <li>• Dry-run Code with Sample Inputs</li>
            </ul>
          </div>

        </div>

        <!-- Practice Callout -->
        <div class="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div class="space-y-2 text-center md:text-left">
            <h2 class="text-2xl font-bold">Ready to test your technical skills?</h2>
            <p class="text-slate-400 text-sm">Launch a live AI-proctored technical coding interview session right now.</p>
          </div>
          <a 
            routerLink="/mock-interview"
            class="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap">
            Start Mock Interview Engine →
          </a>
        </div>

      </div>
    </div>
  `
})
export class TechnicalGuidesComponent {}
